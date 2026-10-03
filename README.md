# Pixelería

Generador procedural de pixel art en el navegador. Dos modos:

- **Personajes**: sprites simétricos con silueta aleatoria, sombreado direccional, contorno y ojos. Tamaños 16/24/32 px, 8 paletas curadas.
- **Paisajes**: escenas por capas (cielo con dithering Bayer, sol/luna, nubes, montañas por desplazamiento de punto medio, agua o pradera con árboles). 4 momentos del día con paleta propia.

Todo es determinista por semilla: la misma semilla + configuración reproduce la misma imagen. El historial guarda las últimas generaciones para volver a cualquiera con un clic.

## Uso

Doble clic en `index.html` — funciona directamente en el navegador, sin servidor ni dependencias.

## Estructura

```
index.html        UI
styles.css        estilos
js/main.js        estado y wiring de controles
js/character.js   generador de personajes
js/landscape.js   generador de paisajes
js/palettes.js    paletas curadas
js/render.js      canvas y exportación PNG
js/color.js       utilidades de color y dithering
js/rng.js         PRNG con semilla
```
