# Graphify — Grafo de dependencias del proyecto

Este frontend Angular comparte el grafo del backend. Para consultarlo:

1. El grafo se construye desde `PostgradoBackend/`. Asegurarse de que esté actualizado.

2. Leer `PostgradoBackend/graphify-out/GRAPH_REPORT.md` para entender las conexiones entre módulos.

3. Para consultas específicas del frontend, ejecutar:
   ```bash
   cd ~/Programación/PostgradoBackend
   graphify query "<pregunta sobre frontend>"
   ```

4. Para reconstruir incluyendo el frontend:
   ```bash
   cd ~/Programación/PostgradoBackend
   /graphify . ~/Programación/Postgrado-Frontend/src
   ```
