document.addEventListener('DOMContentLoaded', function() {

    // --- SELEÇÃO DE ELEMENTOS ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const themeSwitchWrapper = document.querySelector('.theme-switch-wrapper');
    const formContainer = document.querySelector('.form-container');
    const clearBtn = document.getElementById('clear-form-btn');
    const exportBtn = document.getElementById('export-pdf-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const allTrackedElements = document.querySelectorAll('.track-progress');
    const totalFields = allTrackedElements.length;

    // --- LÓGICA DO MODO ESCURO ---
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        darkModeToggle.checked = theme === 'dark';
        updateThemeIcon(theme); // Atualiza o ícone ao mudar o tema
    }

    function updateThemeIcon(theme) {
        // Encontra e remove o ícone antigo, se existir
        const existingIcon = themeSwitchWrapper.querySelector('i.fas');
        if (existingIcon) {
            existingIcon.remove();
        }

        // Cria o novo ícone
        const newIcon = document.createElement('i');
        newIcon.classList.add('fas'); // Classe base da Font Awesome

        // Adiciona a classe específica de sol ou lua
        if (theme === 'dark') {
            newIcon.classList.add('fa-moon');
        } else {
            newIcon.classList.add('fa-sun');
        }
        
        // Adiciona o novo ícone no início do wrapper
        themeSwitchWrapper.prepend(newIcon);
    }

    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    });

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);


    // --- FUNÇÕES DE DADOS E PROGRESSO ---

    function saveData() {
        const data = {};
        allTrackedElements.forEach(element => {
            if (element.classList.contains('form-group-radio')) {
                const checkedRadio = element.querySelector('input[type="radio"]:checked');
                const groupName = element.querySelector('input[type="radio"]').name;
                data[groupName] = checkedRadio ? checkedRadio.id : null;
            } 
            else {
                data[element.id] = element.value;
            }
        });
        localStorage.setItem('fortesPlaybookData', JSON.stringify(data));
    }

    function loadData() {
        const savedData = JSON.parse(localStorage.getItem('fortesPlaybookData'));
        if (!savedData) return;

        allTrackedElements.forEach(element => {
            if (element.classList.contains('form-group-radio')) {
                const groupName = element.querySelector('input[type="radio"]').name;
                const checkedId = savedData[groupName];
                if (checkedId) {
                    const radioToSelect = document.getElementById(checkedId);
                    if (radioToSelect) radioToSelect.checked = true;
                }
            } else {
                if (savedData[element.id] !== undefined) {
                    element.value = savedData[element.id];
                }
            }
        });
    }

    function updateProgress() {
        let completedFields = 0;
        allTrackedElements.forEach(element => {
            if (element.classList.contains('form-group-radio')) {
                if (element.querySelector('input[type="radio"]:checked')) {
                    completedFields++;
                }
            } else {
                if (element.value.trim() !== '') {
                    completedFields++;
                }
            }
        });
        const progressPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
        progressBar.value = progressPercentage;
        progressText.textContent = `${progressPercentage}%`;
    }

    function clearForm() {
        const confirmClear = confirm('Tem certeza que deseja limpar todos os dados do formulário?');
        if (confirmClear) {
            document.querySelectorAll('form').forEach(form => form.reset());
            localStorage.removeItem('fortesPlaybookData');
            updateProgress();
            alert('Formulário limpo!');
        }
    }

    function exportToPdf() {
        alert('Preparando seu relatório em PDF! O download começará em breve.');
        
        const printContainer = document.createElement('div');
        const infoGeraisData = {
            "Inicial n.º": document.getElementById('inicial-n').value,
            "Data da elaboração": document.getElementById('data-elaboracao').value,
            "Data da revisão": document.getElementById('data-revisao').value,
            "Nome da parte adversa": document.getElementById('nome-parte-adversa').value,
            "Ação solicitada pelo cliente": document.getElementById('acao-solicitada').value,
            "Observações do(a) Revisor(a)": document.getElementById('observacoes').value
        };
        const execucaoItens = document.querySelectorAll('#execucao .form-group-radio');

        let html = `
            <style>
                body { font-family: sans-serif; color: #333; }
                h1, h2 { color: #2563eb; border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
                .info-item, .checklist-item { border: 1px solid #eee; padding: 10px; border-radius: 5px; margin-bottom: 5px; }
                .info-item strong { color: #555; }
                .checklist-item { display: flex; justify-content: space-between; align-items: center; }
                .checklist-item .answer { font-weight: bold; }
            </style>
            <h1>Relatório do Playbook</h1>
            <h2>Informações Gerais</h2>
            <div class="info-grid">
        `;
        for (const [label, value] of Object.entries(infoGeraisData)) {
            html += `<div class="info-item"><strong>${label}:</strong> ${value || 'Não preenchido'}</div>`;
        }
        html += `</div><h2>Checklist de Execução</h2>`;
        execucaoItens.forEach(item => {
            const question = item.querySelector('.question').textContent;
            const checkedRadio = item.querySelector('input[type="radio"]:checked');
            const answer = checkedRadio ? checkedRadio.parentElement.querySelector('label').textContent : 'Não respondido';
            html += `<div class="checklist-item"><span>${question}</span><span class="answer">${answer}</span></div>`;
        });
        
        printContainer.innerHTML = html;
        document.body.appendChild(printContainer);

        const options = {
            margin:       0.5,
            filename:     `Relatorio_Playbook_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(printContainer).save().then(() => {
            document.body.removeChild(printContainer);
        }).catch(err => {
            console.error("Erro ao gerar PDF:", err);
            document.body.removeChild(printContainer);
        });
    }

    // --- CONFIGURAÇÃO DOS EVENTOS ---
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button, .tab-content').forEach(el => el.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });

    formContainer.addEventListener('input', () => {
        saveData();
        updateProgress();
    });

    clearBtn.addEventListener('click', clearForm);
    exportBtn.addEventListener('click', exportToPdf);

    // --- INICIALIZAÇÃO DA PÁGINA ---
    loadData();
    updateProgress();
});