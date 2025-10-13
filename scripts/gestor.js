/* document.addEventListener('DOMContentLoaded', () => {
    promptGenerator();
}); */

window.monitor.onUpdate((data) => {
    console.log('Datos recibidos en gestor:', data.info);
    if (data.info.type === 'client-info') {
        const payload = data.info.payload.all_mutations;

        const container = document.getElementById('buttons-container');
        container.innerHTML = '';

        const adapFields = {};
        const valueFields = {};

        Object.entries(payload).forEach(([mutation, values]) => {
            const formatField = mutation.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            adapFields[mutation] = formatField;

            values.forEach(val => {
                if (!valueFields[val]) {
                    const formatValue = val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    valueFields[val] = formatValue;
                }
            });
        });

        /* const prettyNames = {
            theme: "Tema",
            language: "Idioma",
            information: "Información",
            display: "Catálogo",
            font_size: "Tamaño de Fuente",
            menu_type: "Tipo de Menú",
            category: "Categoría",
            images: "Imágenes",
        };
        const valueLabels = {
            light: "Claro", dark: "Oscuro", contrast: "Alto Contraste",
            es: "Español", en: "English",
            show: "Mostrar", partial: "Parcial", hide: "Ocultar",
            list: "Lista", grid2: "2 Columnas", grid3: "3 Columnas",
            grid4: "4 Columnas", grid5: "5 Columnas",
            small: "Pequeña", default: "Normal", medium: "Mediana", big: "Grande",
            line: "Línea", dropdown: "Desplegable",
            sports: "Deportes", courses: "Cursos", trips: "Viajes",
            images_show: "Imágenes", no_images: "Sin Imágenes",
        }; */

        console.log('Campos de adaptación:', adapFields);
        console.log('Valores de adaptación:', valueFields);

        Object.entries(payload).forEach(([mutation, values]) => {
            const group = document.createElement('div');
            group.className = 'adaptation-group';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'adaptation-title'; // opcional: para estilos
            titleDiv.textContent = adapFields[mutation] || mutation;
            group.appendChild(titleDiv);

            values.forEach(val => {
                const btn = document.createElement('button');
                btn.textContent = valueFields[val] || val;
                btn.onclick = () => {
                    window.monitor.sendMutation(data.uuid, mutation, val);
                };
                group.appendChild(btn);
            });

            container.appendChild(group);
        });
    }
});

/* function promptGenerator() {
    const sendBtn = document.getElementById('send-prompt');
    const inputTxt = document.getElementById('prompt-input');
    const outputTxt = document.getElementById('prompt-output');

    sendBtn.onclick = async () => {
        const clearTxt = inputTxt.value.trim();

        if (!clearTxt) {
            alert("El campo de entrada no puede estar vacío.");
            return;
        }

        outputTxt.value = "Generando respuesta...";

        try {
            const result = await window.monitor.generatePrompt(clearTxt);
            outputTxt.value = result || "No se obtuvo respuesta.";
        } catch (error) {
            console.error(error);
            outputTxt.value = "Error al generar contenido.";
        }
    };
} */