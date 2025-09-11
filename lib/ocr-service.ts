import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface OCRResult {
  fecha: string | null;
  total: number | null;
  subtotal: number | null;
  iva: number | null;
  rfc_emisor: string | null;
  nombre_emisor: string | null;
  concepto: string | null;
  categoria: 'insumos' | 'servicios' | 'equipos' | 'marketing' | 'gastos_operativos' | 'otros' | null;
  confidence: number;
  api_provider: string;
  processing_time_ms: number;
  raw_response: any;
  validation_errors: string[];
}

export async function processTicketOCR(imageUrl: string): Promise<OCRResult> {
  const startTime = Date.now();
  
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    console.log(`🔍 Starting OCR process for image: ${imageUrl}`);

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const mediaType = contentType.includes('png') ? 'image/png' : 
                     contentType.includes('webp') ? 'image/webp' : 'image/jpeg';
    
    const prompt = `Analiza este ticket de compra mexicano y extrae la información fiscal requerida.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional.

Estructura requerida:
{
  "fecha": "YYYY-MM-DD",
  "total": 123.45,
  "subtotal": 95.00,
  "iva": 15.20,
  "rfc_emisor": "ABC123456789",
  "nombre_emisor": "Nombre del Negocio S.A. de C.V.",
  "concepto": "descripción breve del gasto",
  "categoria": "insumos|servicios|equipos|marketing|gastos_operativos|otros",
  "confidence": 0.95
}

Reglas específicas:
- fecha: Formato ISO (YYYY-MM-DD), si no es legible usar null
- total: Monto total en pesos mexicanos (número decimal)
- subtotal: Monto antes del IVA (número decimal)
- iva: Monto del IVA por separado (número decimal, generalmente 16% del subtotal)
- rfc_emisor: RFC del emisor (13 caracteres, formato mexicano válido)
- nombre_emisor: Razón social o nombre del emisor
- concepto: Descripción corta del producto/servicio principal
- categoria: Clasificar como:
  * "insumos": café, leche, azúcar, materias primas
  * "servicios": electricidad, gas, internet, telefonía
  * "equipos": máquinas de café, mobiliario, utensilios
  * "marketing": publicidad, promociones, diseño
  * "gastos_operativos": renta, limpieza, mantenimiento
  * "otros": gastos que no encajan en categorías anteriores
- confidence: Tu nivel de confianza en la extracción (0.0 a 1.0)

Validaciones:
- El RFC debe tener exactamente 13 caracteres para personas morales o 12 para físicas
- El IVA típico en México es 16% del subtotal
- Las fechas deben ser realistas (no futuras, no muy antiguas)
- Los montos deben ser positivos y realistas

Si algún campo no es legible o no está presente, usar null.`;

    console.log(`📡 Calling Anthropic API...`);

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Image
              }
            },
            {
              type: "text",
              text: prompt
            }
          ]
        }
      ]
    });

    console.log(`✅ Anthropic API response received`);

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }
    
    let parsedResult;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : textContent.text;
      parsedResult = JSON.parse(jsonString);
      console.log(`📋 OCR extracted data:`, parsedResult);
    } catch (parseError) {
      console.error('Failed to parse OCR response:', textContent.text);
      throw new Error(`Failed to parse OCR response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }
    
    const validationErrors = validateOCRResult(parsedResult);
    
    const result: OCRResult = {
      fecha: parsedResult.fecha || null,
      total: typeof parsedResult.total === 'number' ? parsedResult.total : null,
      subtotal: typeof parsedResult.subtotal === 'number' ? parsedResult.subtotal : null,
      iva: typeof parsedResult.iva === 'number' ? parsedResult.iva : null,
      rfc_emisor: parsedResult.rfc_emisor || null,
      nombre_emisor: parsedResult.nombre_emisor || null,
      concepto: parsedResult.concepto || null,
      categoria: isValidCategoria(parsedResult.categoria) ? parsedResult.categoria : null,
      confidence: Math.min(Math.max(parsedResult.confidence || 0, 0), 1),
      api_provider: 'anthropic',
      processing_time_ms: Date.now() - startTime,
      raw_response: response,
      validation_errors: validationErrors
    };
    
    if (result.rfc_emisor && !validateRFC(result.rfc_emisor)) {
      result.rfc_emisor = null;
      result.confidence = Math.max(result.confidence - 0.2, 0);
      result.validation_errors.push('RFC format validation failed');
    }
    
    if (result.total && result.subtotal && result.iva) {
      const expectedIva = Math.round(result.subtotal * 0.16 * 100) / 100;
      const calculatedTotal = result.subtotal + result.iva;
      
      if (Math.abs(calculatedTotal - result.total) > 0.5) {
        result.confidence = Math.max(result.confidence - 0.1, 0);
        result.validation_errors.push('Total calculation mismatch');
      }
      
      if (Math.abs(result.iva - expectedIva) > result.subtotal * 0.05) {
        result.validation_errors.push('IVA amount seems inconsistent with 16% rate');
      }
    }
    
    console.log(`🎯 OCR processing completed in ${result.processing_time_ms}ms with confidence: ${result.confidence}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ OCR Processing Error:', error);
    
    return {
      fecha: null,
      total: null,
      subtotal: null,
      iva: null,
      rfc_emisor: null,
      nombre_emisor: null,
      concepto: null,
      categoria: null,
      confidence: 0,
      api_provider: 'anthropic',
      processing_time_ms: Date.now() - startTime,
      raw_response: null,
      validation_errors: [error instanceof Error ? error.message : 'Unknown OCR error']
    };
  }
}

function validateRFC(rfc: string): boolean {
  const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  return rfcPattern.test(rfc.toUpperCase());
}

function isValidCategoria(categoria: any): categoria is OCRResult['categoria'] {
  const validCategorias = ['insumos', 'servicios', 'equipos', 'marketing', 'gastos_operativos', 'otros'];
  return validCategorias.includes(categoria);
}

function validateOCRResult(result: any): string[] {
  const errors: string[] = [];
  
  if (result.fecha && !isValidDate(result.fecha)) {
    errors.push('Invalid date format');
  }
  
  if (result.total !== null && (typeof result.total !== 'number' || result.total < 0)) {
    errors.push('Invalid total amount');
  }
  
  if (result.subtotal !== null && (typeof result.subtotal !== 'number' || result.subtotal < 0)) {
    errors.push('Invalid subtotal amount');
  }
  
  if (result.iva !== null && (typeof result.iva !== 'number' || result.iva < 0)) {
    errors.push('Invalid IVA amount');
  }
  
  if (result.confidence !== null && (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1)) {
    errors.push('Invalid confidence value');
  }
  
  return errors;
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return !isNaN(date.getTime()) && 
         date >= oneYearAgo && 
         date <= oneWeekFromNow;
}

export async function processTicketOCRWithRetry(
  imageUrl: string, 
  maxRetries: number = 3
): Promise<OCRResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 OCR attempt ${attempt}/${maxRetries} for image: ${imageUrl}`);
      
      const result = await processTicketOCR(imageUrl);
      
      if (result.confidence >= 0.7 || attempt === maxRetries) {
        if (result.confidence < 0.7) {
          console.warn(`⚠️ Low confidence result (${result.confidence}) after ${maxRetries} attempts`);
        }
        return result;
      }
      
      console.warn(`⚠️ Low confidence result from attempt ${attempt} (${result.confidence}), retrying...`);
      
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ OCR attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error');
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All OCR attempts failed');
}

export interface ProcessingStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  averageConfidence: number;
  averageProcessingTime: number;
  totalCost: number;
}

export class OCRProcessor {
  private stats: ProcessingStats = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    averageConfidence: 0,
    averageProcessingTime: 0,
    totalCost: 0
  };

  async processTicket(imageUrl: string): Promise<OCRResult> {
    const result = await processTicketOCRWithRetry(imageUrl);
    this.updateStats(result);
    return result;
  }

  private updateStats(result: OCRResult): void {
    this.stats.totalProcessed++;
    
    if (result.confidence > 0) {
      this.stats.successful++;
      this.stats.averageConfidence = (
        (this.stats.averageConfidence * (this.stats.successful - 1) + result.confidence) / 
        this.stats.successful
      );
    } else {
      this.stats.failed++;
    }
    
    this.stats.averageProcessingTime = (
      (this.stats.averageProcessingTime * (this.stats.totalProcessed - 1) + result.processing_time_ms) / 
      this.stats.totalProcessed
    );
    
    this.stats.totalCost += 0.003;
  }

  getStats(): ProcessingStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      totalCost: 0
    };
  }
}

export const ocrProcessor = new OCRProcessor();