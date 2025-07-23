document.addEventListener('DOMContentLoaded', function() {

    // --- SELEÇÃO DE ELEMENTOS ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const themeSwitchWrapper = document.querySelector('.theme-switch-wrapper');
    const formContainer = document.querySelector('.form-container');
    const clearBtn = document.getElementById('clear-form-btn');
    const exportBtn = document.getElementById('export-pdf-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const assinanteNomeInput = document.getElementById('assinante-nome');
    const assinarBtn = document.getElementById('btn-assinar');
    const assinaturaDigitalDisplay = document.getElementById('assinatura-digital');
    const ajuizamentoSimRadio = document.getElementById('ajuizamento-sim');
    const ajuizamentoNaoRadio = document.getElementById('ajuizamento-nao');
    const blocoAcaoAjuizada = document.getElementById('bloco-acao-ajuizada');
    const blocoMotivoNao = document.getElementById('bloco-motivo-nao');
    const customSelectWrapper = document.getElementById('action-type-select-wrapper');
    const selectedActionText = document.getElementById('selected-action-text');
    const customOptions = document.querySelectorAll('.custom-option');
    const todayButtons = document.querySelectorAll('.today-btn');


    // --- LÓGICA DO MODO ESCURO ---
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        darkModeToggle.checked = theme === 'dark';
        updateThemeIcon(theme);
    }

    function updateThemeIcon(theme) {
        const existingIcon = themeSwitchWrapper.querySelector('i.fas');
        if (existingIcon) {
            existingIcon.remove();
        }
        const newIcon = document.createElement('i');
        newIcon.classList.add('fas');
        if (theme === 'dark') {
            newIcon.classList.add('fa-moon');
        } else {
            newIcon.classList.add('fa-sun');
        }
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


    // --- LÓGICA DO SELETOR CUSTOMIZADO ---
    
    function handleSelectAction(value) {
        document.querySelectorAll('.action-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`content-${value}`).classList.add('active');

        const option = document.querySelector(`.custom-option[data-value="${value}"]`);
        if (option) {
            selectedActionText.innerHTML = option.innerHTML;
        }

        customOptions.forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.value === value) {
                opt.classList.add('selected');
            }
        });

        customSelectWrapper.dataset.selectedValue = value;
        updateProgress();
    }

    customSelectWrapper.addEventListener('click', () => {
        customSelectWrapper.classList.toggle('open');
    });

    customOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.dataset.value;
            handleSelectAction(value);
            customSelectWrapper.classList.remove('open');
        });
    });

    window.addEventListener('click', (e) => {
        if (!customSelectWrapper.contains(e.target)) {
            customSelectWrapper.classList.remove('open');
        }
    });


    // --- LÓGICA DE ASSINATURA ---
    function handleAssinatura() {
        const nome = assinanteNomeInput.value.trim();
        if (!nome) {
            alert('Por favor, digite o nome do assinante antes de assinar.');
            assinanteNomeInput.focus();
            return;
        }

        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const horaFormatada = agora.toLocaleTimeString('pt-BR');
        const assinaturaTexto = `Assinado digitalmente por: ${nome}\nEm: ${dataFormatada} às ${horaFormatada}`;
        
        assinaturaDigitalDisplay.textContent = assinaturaTexto;
        localStorage.setItem('assinanteNome', nome);
        saveData();
    }


    // --- LÓGICA DOS CAMPOS CONDICIONAIS ---
    function handleAjuizamentoChange() {
        if (ajuizamentoSimRadio.checked) {
            blocoAcaoAjuizada.classList.remove('hidden');
            blocoMotivoNao.classList.add('hidden');
        } else if (ajuizamentoNaoRadio.checked) {
            blocoAcaoAjuizada.classList.add('hidden');
            blocoMotivoNao.classList.remove('hidden');
        }
    }


    // --- FUNÇÃO DE VALIDAÇÃO ---
    function validateRequiredFields() {
        let allValid = true;
        const requiredFields = document.querySelectorAll('#infoGerais [required]');
        
        requiredFields.forEach(field => field.classList.remove('error'));

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                allValid = false;
                field.classList.add('error');
            }
        });

        if (!allValid) {
            alert('Por favor, preencha todos os campos obrigatórios (*) em "Informações Gerais".');
        }

        return allValid;
    }


    // --- FUNÇÃO PARA FORMATAR DATA ---
    function formatDateToBrazilian(dateString) {
        if (!dateString || typeof dateString !== 'string') return 'Não preenchido';
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    }


    // --- FUNÇÕES DE DADOS E PROGRESSO ---

    function saveData() {
        const data = {};
        const allInputs = document.querySelectorAll('input, textarea, select');
        
        allInputs.forEach(input => {
            if (input.type === 'radio') {
                if (input.checked) {
                    data[input.name] = input.id;
                }
            } else if (input.type === 'checkbox') {
                 data[input.id] = input.checked;
            } else {
                data[input.id] = input.value;
            }
        });
        
        data['action-type-select'] = customSelectWrapper.dataset.selectedValue || 'execucao';
        data['assinatura-digital'] = assinaturaDigitalDisplay.textContent;
        localStorage.setItem('fortesPlaybookData', JSON.stringify(data));
    }

    function loadData() {
        const savedAssinante = localStorage.getItem('assinanteNome');
        if (savedAssinante) {
            assinanteNomeInput.value = savedAssinante;
        }

        const savedData = JSON.parse(localStorage.getItem('fortesPlaybookData'));
        if (!savedData) return;

        const allInputs = document.querySelectorAll('input, textarea, select');
        allInputs.forEach(input => {
             if (input.type === 'radio') {
                if (savedData[input.name] === input.id) {
                    input.checked = true;
                }
            } else if (input.type === 'checkbox') {
                if (savedData[input.id] !== undefined) {
                    input.checked = savedData[input.id];
                }
            } else {
                if (savedData[input.id] !== undefined) {
                    input.value = savedData[input.id];
                }
            }
        });
        
        if (savedData['assinatura-digital']) {
            assinaturaDigitalDisplay.textContent = savedData['assinatura-digital'];
        }

        if (savedData['action-type-select']) {
            handleSelectAction(savedData['action-type-select']);
        }

        handleAjuizamentoChange();
    }

    function updateProgress() {
        const infoGeraisFields = document.querySelectorAll('#infoGerais [required]');
        const activeActionContent = document.querySelector('.action-content.active');
        const actionFields = activeActionContent.querySelectorAll('.track-progress');
        
        const fieldsToTrack = [...infoGeraisFields, ...actionFields];
        const totalFields = fieldsToTrack.length;

        let completedFields = 0;
        fieldsToTrack.forEach(element => {
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
            document.querySelectorAll('form, .action-content').forEach(form => form.reset());
            
            handleSelectAction('execucao');

            assinanteNomeInput.value = '';
            assinaturaDigitalDisplay.textContent = '';
            
            localStorage.removeItem('fortesPlaybookData');
            localStorage.removeItem('assinanteNome');

            updateProgress();
            alert('Formulário limpo!');
        }
    }


    // --- FUNÇÃO DE EXPORTAÇÃO PARA PDF ---

    function exportToPdf() {
        if (!validateRequiredFields()) return;

        const assinaturaTexto = assinaturaDigitalDisplay.textContent.trim();
        if (!assinaturaTexto) {
            alert('O documento precisa ser assinado antes de ser exportado.');
            return;
        }

        alert('Preparando seu relatório em PDF! O download começará em breve.');
        
        const printContainer = document.createElement('div');
        const infoGeraisData = {
            "Inicial n.º": document.getElementById('inicial-n').value,
            "Data da elaboração": formatDateToBrazilian(document.getElementById('data-elaboracao').value),
            "Data da revisão": formatDateToBrazilian(document.getElementById('data-revisao').value),
            "Nome da parte adversa": document.getElementById('nome-parte-adversa').value,
            "Ação solicitada pelo cliente": document.getElementById('acao-solicitada').value,
            "Observações do(a) Revisor(a)": document.getElementById('observacoes').value
        };

        const activeActionContent = document.querySelector('.action-content.active');
        const actionItems = activeActionContent.querySelectorAll('.form-group-radio');
        const actionTitle = selectedActionText.textContent.trim();
        
        let html = `
            <style>
                body { font-family: sans-serif; color: #333; }
                h1, h2 { color: #2563eb; border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; margin-top: 20px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
                .info-item, .checklist-item { border: 1px solid #eee; padding: 10px; border-radius: 5px; margin-bottom: 5px; }
                .info-item strong { color: #555; }
                .checklist-item { display: flex; justify-content: space-between; align-items: center; }
                .checklist-item .answer { font-weight: bold; }
                .assinatura-pdf { margin-top: 30px; padding-top: 15px; border-top: 2px solid #f0f0f0; }
                .assinatura-pdf p { white-space: pre-wrap; font-family: monospace; }
            </style>
            <h1>Relatório do Checklist</h1>
            <h2>Informações Gerais</h2>
            <div class="info-grid">
        `;
        for (const [label, value] of Object.entries(infoGeraisData)) {
            html += `<div class="info-item"><strong>${label}:</strong> ${value || 'Não preenchido'}</div>`;
        }
        
        html += `</div>`;

        if (actionItems.length > 0) {
            html += `<h2>Checklist de ${actionTitle}</h2>`;
            actionItems.forEach(item => {
                const question = item.querySelector('.question').textContent;
                const checkedRadio = item.querySelector('input[type="radio"]:checked');
                const answer = checkedRadio ? checkedRadio.parentElement.querySelector('label').textContent : 'Não respondido';
                html += `<div class="checklist-item"><span>${question}</span><span class="answer">${answer}</span></div>`;
            });
        }

        html += `<div class="assinatura-pdf"><h2>Assinatura</h2><p>${assinaturaTexto.replace(/\n/g, '<br>')}</p></div>`;
        
        printContainer.innerHTML = html;
        document.body.appendChild(printContainer);

        const options = {
            margin:       0.5,
            filename:     `Relatorio_Checklist_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
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
    assinarBtn.addEventListener('click', handleAssinatura);
    ajuizamentoSimRadio.addEventListener('change', handleAjuizamentoChange);
    ajuizamentoNaoRadio.addEventListener('change', handleAjuizamentoChange);

    todayButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInputId = button.dataset.target;
            const targetInput = document.getElementById(targetInputId);

            if (targetInput) {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                
                targetInput.value = `${year}-${month}-${day}`;

                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });

    // --- INICIALIZAÇÃO DA PÁGINA ---
    loadData();
    updateProgress();
});