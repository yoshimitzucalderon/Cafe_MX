// Shared mock database for local development
// This replaces Supabase when the server is not available

class MockDatabase {
  private clients = new Map<string, any>();
  private userClients = new Map<string, any>();

  // Store a client
  setClient(slug: string, client: any) {
    this.clients.set(slug, client);
  }

  // Get a client by slug
  getClient(slug: string) {
    return this.clients.get(slug);
  }

  // Store user-client relationship
  setUserClient(userClientKey: string, relationship: any) {
    this.userClients.set(userClientKey, relationship);
  }

  // Get all clients for a user
  getUserClients(userId: string) {
    const userClientsList = [];

    for (const [key, value] of this.userClients.entries()) {
      if (key.startsWith(userId + '_') && value.activo) {
        // Find the corresponding client
        const client = this.clients.get(value.slug);
        if (client) {
          userClientsList.push({
            cliente_id: client.id,
            schema_name: value.schema_name,
            rol: value.rol,
            activo: value.activo,
            cliente: client
          });
        }
      }
    }

    return userClientsList;
  }

  // Check if user has any clients
  hasClients(userId: string): boolean {
    for (const [key, value] of this.userClients.entries()) {
      if (key.startsWith(userId + '_') && value.activo) {
        return true;
      }
    }
    return false;
  }

  // Check if slug exists
  slugExists(slug: string): boolean {
    return this.clients.has(slug);
  }

  // Get all data (for debugging)
  getAllData() {
    return {
      clients: Object.fromEntries(this.clients),
      userClients: Object.fromEntries(this.userClients)
    };
  }

  // Clear all data
  clear() {
    this.clients.clear();
    this.userClients.clear();
  }
}

// Export singleton instance
export const mockDB = new MockDatabase();

// Helper functions
export function parseJWT(token: string) {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    return payload;
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

export function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 20);
}

export function generateUniqueSlug(businessName: string): string {
  const baseSlug = generateSlug(businessName);
  let slug = baseSlug;
  let counter = 1;

  while (mockDB.slugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}