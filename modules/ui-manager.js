/**
 * ui-manager.js - Gestionarea interfeței utilizator
 *
 * Acest modul se ocupă de:
 * - Manipularea DOM-ului
 * - Animații
 * - Mesaje și notificări
 * - Actualizarea display-ului
 */

/**
 * Clasa pentru gestionarea UI-ului
 */
export class UIManager {
    constructor() {
        this.elements = {};
        this.toastTimeout = null;
    }

    /**
     * Inițializează referințele la elementele DOM
     */
    init() {
        this.elements = {
            algorithmTitle: document.getElementById('algorithmTitle'),
            appTitle: document.getElementById('appTitle'),
            statusMessage: document.getElementById('statusMessage'),
            numbersContainer: document.getElementById('numbersContainer'),
            startBtn: document.getElementById('startBtn'),
            checkBtn: document.getElementById('checkBtn'),
            resetBtn: document.getElementById('resetBtn'),
            algorithmDesc: document.getElementById('algorithmDesc'),
            algorithmRules: document.getElementById('algorithmRules'),
            moveCount: document.getElementById('moveCount'),
            correctMoves: document.getElementById('correctMoves'),
            efficiency: document.getElementById('efficiency'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            expectedMove: document.getElementById('expectedMove'),
            expectedMoveText: document.getElementById('expectedMoveText'),
            successModal: document.getElementById('successModal'),
            modalAlgorithm: document.getElementById('modalAlgorithm'),
            modalMoves: document.getElementById('modalMoves'),
            modalEfficiency: document.getElementById('modalEfficiency'),
            modalTime: document.getElementById('modalTime'),
            methodButtons: document.querySelectorAll('.method-btn')
        };
    }

    /**
     * Actualizează titlul algoritmului curent
     * @param {string} title - Numele algoritmului
     */
    setAlgorithmTitle(title) {
        if (this.elements.algorithmTitle) {
            this.elements.algorithmTitle.textContent = title;
        }
    }

    /**
     * Actualizează descrierea algoritmului
     * @param {Object} algorithm - Obiectul algoritmului
     */
    setAlgorithmInfo(algorithm) {
        if (this.elements.algorithmDesc) {
            this.elements.algorithmDesc.textContent = algorithm.description;
        }

        if (this.elements.algorithmRules) {
            this.elements.algorithmRules.innerHTML = algorithm.rules
                .map(rule => `<li>${rule}</li>`)
                .join('');
        }

        // Actualizează butoanele de metodă
        this.elements.methodButtons?.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.method === algorithm.key);
        });
    }

    /**
     * Actualizează mesajul de status
     * @param {string} message - Mesajul de afișat
     * @param {string} type - Tipul mesajului ('success', 'error', 'info', '')
     */
    setStatusMessage(message, type = '') {
        if (this.elements.statusMessage) {
            this.elements.statusMessage.textContent = message;
            this.elements.statusMessage.className = `status-message ${type}`;
        }
    }

    /**
     * Generează cardurile pentru numere
     * @param {number[]} numbers - Array-ul de numere
     * @param {Function} onClickCallback - Funcția apelată la click
     */
    renderNumbers(numbers, onClickCallback) {
        const container = this.elements.numbersContainer;
        if (!container) return;

        container.innerHTML = '';

        numbers.forEach((number, index) => {
            const card = document.createElement('div');
            card.className = 'number-card';
            card.textContent = number;
            card.dataset.value = number;
            card.dataset.index = index;

            card.addEventListener('click', () => onClickCallback(index));

            container.appendChild(card);
        });
    }

    /**
     * Actualizează afișarea numerelor fără a le regenera
     * @param {number[]} numbers - Array-ul actualizat
     */
    updateNumbers(numbers) {
        const cards = this.elements.numbersContainer?.querySelectorAll('.number-card');
        if (!cards) return;

        cards.forEach((card, index) => {
            card.textContent = numbers[index];
            card.dataset.value = numbers[index];
        });
    }

    /**
     * Selectează vizual un card
     * @param {number} index - Indexul cardului
     */
    selectCard(index) {
        const cards = this.elements.numbersContainer?.querySelectorAll('.number-card');
        if (!cards) return;

        cards.forEach((card, i) => {
            card.classList.toggle('selected', i === index);
        });
    }

    /**
     * Deselectează toate cardurile
     */
    deselectAllCards() {
        const cards = this.elements.numbersContainer?.querySelectorAll('.number-card');
        cards?.forEach(card => card.classList.remove('selected'));
    }

    /**
     * Animează un swap corect
     * @param {number[]} indices - Indicii elementelor schimbate
     * @param {number[]} newNumbers - Numerele actualizate
     * @returns {Promise}
     */
    animateCorrectSwap(indices, newNumbers) {
        return new Promise(resolve => {
            const cards = this.elements.numbersContainer?.querySelectorAll('.number-card');
            if (!cards) {
                resolve();
                return;
            }

            const [idx1, idx2] = indices;
            const card1 = cards[idx1];
            const card2 = cards[idx2];

            // Adaugă clasa de animație
            card1?.classList.add('correct-move', 'swapping');
            card2?.classList.add('correct-move', 'swapping');

            setTimeout(() => {
                // Actualizează valorile
                if (card1) {
                    card1.textContent = newNumbers[idx1];
                    card1.dataset.value = newNumbers[idx1];
                }
                if (card2) {
                    card2.textContent = newNumbers[idx2];
                    card2.dataset.value = newNumbers[idx2];
                }

                setTimeout(() => {
                    card1?.classList.remove('correct-move', 'swapping', 'selected');
                    card2?.classList.remove('correct-move', 'swapping', 'selected');
                    resolve();
                }, 300);
            }, 300);
        });
    }

    /**
     * Animează o mutare greșită (shake)
     * @param {number[]} indices - Indicii elementelor
     * @returns {Promise}
     */
    animateIncorrectMove(indices) {
        return new Promise(resolve => {
            const cards = this.elements.numbersContainer?.querySelectorAll('.number-card');
            if (!cards) {
                resolve();
                return;
            }

            indices.forEach(idx => {
                cards[idx]?.classList.add('incorrect-move');
            });

            setTimeout(() => {
                indices.forEach(idx => {
                    cards[idx]?.classList.remove('incorrect-move', 'selected');
                });
                resolve();
            }, 600);
        });
    }

    /**
     * Evidențiază elementele așteptate
     * @param {number[]} indices - Indicii de evidențiat
     */
    highlightExpected(indices) {
        const cards = this.elements.numbersContainer?.querySelectorAll('.number-card');
        if (!cards) return;

        cards.forEach((card, idx) => {
            card.classList.toggle('hint', indices.includes(idx));
        });

        // Elimină highlight-ul după 2 secunde
        setTimeout(() => {
            cards.forEach(card => card.classList.remove('hint'));
        }, 2000);
    }

    /**
     * Marchează elementele ca sortate
     * @param {number} upToIndex - Până la ce index sunt sortate
     */
    markSorted(upToIndex) {
        const cards = this.elements.numbersContainer?.querySelectorAll('.number-card');
        if (!cards) return;

        cards.forEach((card, idx) => {
            card.classList.toggle('sorted', idx < upToIndex);
        });
    }

    /**
     * Actualizează statisticile
     * @param {Object} stats - Obiectul cu statistici
     */
    updateStats(stats) {
        if (this.elements.moveCount) {
            this.elements.moveCount.textContent = stats.totalMoves;
        }
        if (this.elements.correctMoves) {
            this.elements.correctMoves.textContent = stats.correctMoves;
        }
        if (this.elements.efficiency) {
            this.elements.efficiency.textContent = `${stats.efficiency}%`;
        }
    }

    /**
     * Actualizează bara de progres
     * @param {Object} progress - Obiectul cu progres
     */
    updateProgress(progress) {
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${progress.percentage}%`;
        }
        if (this.elements.progressText) {
            this.elements.progressText.textContent = `${progress.completed} / ${progress.total}`;
        }
    }

    /**
     * Actualizează indicația pentru mutarea așteptată
     * @param {string} hint - Textul indicației
     */
    setExpectedMoveHint(hint) {
        if (this.elements.expectedMove) {
            this.elements.expectedMove.style.display = hint ? 'block' : 'none';
        }
        if (this.elements.expectedMoveText) {
            this.elements.expectedMoveText.textContent = hint || '';
        }
    }

    /**
     * Afișează un toast (notificare temporară)
     * @param {string} message - Mesajul de afișat
     * @param {string} type - Tipul ('success', 'error', 'info')
     * @param {number} duration - Durata în ms
     */
    showToast(message, type = '', duration = 3000) {
        // Elimină toast-ul anterior dacă există
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        this.toastTimeout = setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * Afișează modalul de succes
     * @param {Object} data - Datele pentru modal
     */
    showSuccessModal(data) {
        if (this.elements.modalAlgorithm) {
            this.elements.modalAlgorithm.textContent = data.algorithmName;
        }
        if (this.elements.modalMoves) {
            this.elements.modalMoves.textContent = data.totalMoves;
        }
        if (this.elements.modalEfficiency) {
            this.elements.modalEfficiency.textContent = `${data.efficiency}%`;
        }
        if (this.elements.modalTime) {
            this.elements.modalTime.textContent = `${data.duration}s`;
        }
        if (this.elements.successModal) {
            this.elements.successModal.style.display = 'block';
        }
    }

    /**
     * Închide modalul de succes
     */
    closeModal() {
        if (this.elements.successModal) {
            this.elements.successModal.style.display = 'none';
        }
    }

    /**
     * Activează/Dezactivează butoanele
     * @param {Object} states - Stările butoanelor
     */
    setButtonStates(states) {
        if (states.start !== undefined && this.elements.startBtn) {
            this.elements.startBtn.disabled = !states.start;
        }
        if (states.check !== undefined && this.elements.checkBtn) {
            this.elements.checkBtn.disabled = !states.check;
        }
        if (states.reset !== undefined && this.elements.resetBtn) {
            this.elements.resetBtn.disabled = !states.reset;
        }
    }

    /**
     * Resetează UI-ul la starea inițială
     */
    resetUI() {
        this.setAlgorithmTitle('Începe un joc nou');
        this.setStatusMessage('Apasă "Start Joc" pentru a începe sortarea!');
        this.deselectAllCards();
        this.updateStats({ totalMoves: 0, correctMoves: 0, efficiency: 100 });
        this.updateProgress({ completed: 0, total: 0, percentage: 0 });
        this.setExpectedMoveHint('');
        this.setButtonStates({ start: true, check: false, reset: false });

        if (this.elements.numbersContainer) {
            this.elements.numbersContainer.innerHTML = '';
        }

        if (this.elements.algorithmDesc) {
            this.elements.algorithmDesc.textContent =
                'Selectează un algoritm pentru a vedea descrierea.';
        }

        if (this.elements.algorithmRules) {
            this.elements.algorithmRules.innerHTML = '';
        }

        // Deselectează butoanele de metodă
        this.elements.methodButtons?.forEach(btn => {
            btn.classList.remove('active');
        });
    }
}

// Exportă instanța singleton
export const uiManager = new UIManager();
