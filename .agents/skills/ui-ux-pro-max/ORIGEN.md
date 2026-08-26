# Origen de esta skill

Copia vendorizada, no una dependencia. Vive en el repo para que quien clone el
proyecto la tenga sin instalar nada.

| | |
|---|---|
| Origen | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill |
| Commit | `e4f45473691e4b389519ee4bc359a3d6df666c26` (2026-08-26) |
| Versión | 2.13.0 |
| Licencia | MIT (ver `LICENSE`) |
| Copiado el | 2026-08-26 |

Del repositorio original solo se ha traído la skill `ui-ux-pro-max`. Las otras
seis que trae el paquete (`design`, `ui-styling`, `brand`, `design-system`,
`slides`, `banner-design`) se han dejado fuera: suman unos 20 MB y no hacen
falta aquí.

## Modificación local

**Una sola, y hay que repetirla al actualizar.** El paquete original está
empaquetado como plugin de Claude Code y las rutas de `SKILL.md` usan
`${CLAUDE_PLUGIN_ROOT}`, una variable que solo existe cuando Claude lo carga
como plugin. Al vivir dentro del repo esa variable está vacía y las rutas
quedarían rotas, así que se reescribieron a rutas relativas a la raíz del
proyecto:

```
${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/  →  .agents/skills/ui-ux-pro-max/
```

Son 11 ocurrencias en `SKILL.md`. El resto de archivos está sin tocar.

## Para actualizar

```bash
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill /tmp/uiux
rm -rf .agents/skills/ui-ux-pro-max
cp -r /tmp/uiux/.claude/skills/ui-ux-pro-max .agents/skills/
cp /tmp/uiux/LICENSE .agents/skills/ui-ux-pro-max/
sed -i 's|\${CLAUDE_PLUGIN_ROOT}/\.claude/skills/ui-ux-pro-max/|.agents/skills/ui-ux-pro-max/|g' \
  .agents/skills/ui-ux-pro-max/SKILL.md
```

Y actualizar el commit de la tabla de arriba. Después, comprobar que sigue
funcionando:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "test" --domain ux
```

## Nota sobre `skills-lock.json`

No se ha añadido ahí. Ese archivo lo gestiona la herramienta que instaló las
skills de Supabase, con un `computedHash` cuyo algoritmo no conocemos; escribir
una entrada a mano podría confundirla. Este documento hace de registro de
procedencia en su lugar.
