# 🚀 GitHub Setup Commands

## Después de crear el repositorio "Cafe_MX" en GitHub, ejecuta:

```bash
# Verificar que estamos en la rama main
git branch

# Push main branch
git push -u origin main

# Push develop branch
git checkout develop
git push -u origin develop

# Regresar a main
git checkout main

# Verificar que todo se subió correctamente
git remote -v
git log --oneline -3
```

## Configurar Branch Protection (Manual en GitHub)

1. Ve al repositorio: https://github.com/yoshimitzucalderon/Cafe_MX
2. Settings → Branches
3. Click "Add rule"
4. Branch name pattern: `main`
5. Configurar:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging  
   - ✅ Require up-to-date branches before merging
   - ✅ Include administrators
6. Click "Create"

## Verificar Todo Funciona

```bash
# Verificar repositorio
curl -s https://api.github.com/repos/yoshimitzucalderon/Cafe_MX | grep -E '"name"|"private"|"default_branch"'

# Crear test PR (opcional)
git checkout -b test/github-setup
echo "# GitHub Setup Test" >> TEST.md
git add TEST.md
git commit -m "test: verify GitHub setup"
git push -u origin test/github-setup
# Luego crear PR en GitHub UI
```

## URLs Importantes

- **Repositorio**: https://github.com/yoshimitzucalderon/Cafe_MX
- **Settings**: https://github.com/yoshimitzucalderon/Cafe_MX/settings  
- **Branches**: https://github.com/yoshimitzucalderon/Cafe_MX/settings/branches
- **Actions**: https://github.com/yoshimitzucalderon/Cafe_MX/actions

¡Listo para continuar con Vercel! 🎉