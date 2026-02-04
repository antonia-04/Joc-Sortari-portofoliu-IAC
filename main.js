/**
 * main.js - Punct de intrare și inițializare
 *
 * Acest modul conectează motorul de joc cu interfața utilizator
 * și gestionează evenimentele principale.
 */

import { gameEngine, GAME_STATES } from './modules/game-engine.js';
import { uiManager } from './modules/ui-manager.js';

/**
 * Controller principal al aplicației
 */
class AppController {
    constructor() {
        this.engine = gameEngine;
        this.ui = uiManager;
    }

    /**
     * Inițializează aplicația
     */
    init() {
        // Inițializează UI Manager
        this.ui.init();

        // Atașează event listeners
        this.attachEventListeners();

        // Setează starea inițială
        this.ui.resetUI();

        console.log('Provocarea Sortării - Aplicație inițializată');
    }

    /**
     * Atașează event listeners la elementele DOM
     */
    attachEventListeners() {
        // Buton Start
        const startBtn = document.getElementById('startBtn');
        startBtn?.addEventListener('click', () => this.startNewGame());

        // Buton Verifică
        const checkBtn = document.getElementById('checkBtn');
        checkBtn?.addEventListener('click', () => this.checkSolution());

        // Buton Resetează
        const resetBtn = document.getElementById('resetBtn');
        resetBtn?.addEventListener('click', () => this.resetGame());

        // Butoane pentru selectarea metodei
        const methodButtons = document.querySelectorAll('.method-btn');
        methodButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const method = btn.dataset.method;
                if (method) {
                    this.startNewGame(method);
                }
            });
        });

        // Modal - buton închidere
        const modalClose = document.getElementById('modalClose');
        modalClose?.addEventListener('click', () => this.ui.closeModal());

        // Modal - buton joacă din nou
        const playAgainBtn = document.getElementById('playAgainBtn');
        playAgainBtn?.addEventListener('click', () => {
            this.ui.closeModal();
            this.startNewGame();
        });

        // Închide modal la click în afara lui
        const modal = document.getElementById('successModal');
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.ui.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.ui.closeModal();
                this.ui.deselectAllCards();
                this.engine.selectedIndex = null;
            }
        });
    }

    /**
     * Pornește un joc nou
     * @param {string} algorithmKey - Cheia algoritmului (opțional)
     */
    startNewGame(algorithmKey = null) {
        try {
            // Pornește jocul în engine
            const gameData = this.engine.startNewGame(algorithmKey);

            // Actualizează UI
            this.ui.setAlgorithmTitle(gameData.algorithm.name);
            this.ui.setAlgorithmInfo(gameData.algorithm);
            this.ui.setStatusMessage(
                `Misiune: Sortează folosind ${gameData.algorithm.name}!`,
                'info'
            );

            // Renderează numerele
            this.ui.renderNumbers(gameData.numbers, (index) => this.handleCardClick(index));

            // Actualizează progres și statistici
            this.ui.updateProgress({ completed: 0, total: gameData.totalSteps, percentage: 0 });
            this.ui.updateStats({ totalMoves: 0, correctMoves: 0, efficiency: 100 });

            // Afișează indicația pentru prima mutare
            this.ui.setExpectedMoveHint(gameData.firstHint);

            // Activează butoanele
            this.ui.setButtonStates({ start: true, check: true, reset: true });

            // Afișează toast
            this.ui.showToast(`Joc nou început: ${gameData.algorithm.name}`, 'info');

        } catch (error) {
            console.error('Eroare la pornirea jocului:', error);
            this.ui.showToast('Eroare la pornirea jocului!', 'error');
        }
    }

    /**
     * Gestionează click-ul pe un card
     * @param {number} index - Indexul cardului
     */
    async handleCardClick(index) {
        if (this.engine.state !== GAME_STATES.PLAYING) {
            this.ui.showToast('Pornește un joc nou pentru a începe!', 'error');
            return;
        }

        const result = this.engine.selectElement(index);

        if (result.action === 'selected') {
            // Element selectat
            this.ui.selectCard(index);
            this.ui.setStatusMessage(result.message);

        } else if (result.action === 'deselected') {
            // Element deselectat
            this.ui.deselectAllCards();
            this.ui.setStatusMessage('Selectează două elemente pentru a le schimba.');

        } else if (result.correct) {
            // Mutare corectă
            await this.ui.animateCorrectSwap(result.indices, this.engine.numbers);

            // Actualizează UI
            const gameState = this.engine.getGameState();
            this.ui.updateStats(gameState.stats);
            this.ui.updateProgress(gameState.progress);
            this.ui.setExpectedMoveHint(result.nextHint);

            if (result.completed) {
                // Joc terminat
                this.handleGameComplete();
            } else {
                this.ui.setStatusMessage('Corect! Continuă.', 'success');
                this.ui.showToast('Corect! Continuă.', 'success', 1500);
            }

        } else {
            // Mutare greșită
            await this.ui.animateIncorrectMove(result.indices);

            // Evidențiază elementele așteptate
            if (result.expectedIndices) {
                this.ui.highlightExpected(result.expectedIndices);
            }

            // Actualizează UI
            const gameState = this.engine.getGameState();
            this.ui.updateStats(gameState.stats);
            this.ui.setStatusMessage(result.message, 'error');
            this.ui.showToast(result.message, 'error', 4000);
        }
    }

    /**
     * Verifică soluția
     */
    checkSolution() {
        if (this.engine.state === GAME_STATES.IDLE) {
            this.ui.showToast('Pornește întâi un joc nou!', 'error');
            return;
        }

        if (this.engine.isSorted()) {
            this.handleGameComplete();
        } else {
            const progress = this.engine.getProgress();
            this.ui.showToast(
                `Nu este încă sortat! Mai ai ${progress.remaining} mutări de făcut.`,
                'error'
            );
            this.ui.setStatusMessage(
                `Mai sunt ${progress.remaining} mutări necesare. Urmează indicațiile!`,
                'error'
            );
        }
    }

    /**
     * Gestionează finalizarea jocului
     */
    handleGameComplete() {
        const stats = this.engine.getStats();
        const algorithm = this.engine.currentAlgorithm;

        this.ui.setStatusMessage('Felicitări! Vectorul este sortat corect!', 'success');
        this.ui.showToast('Felicitări! Ai reușit!', 'success');

        // Afișează modalul de succes
        this.ui.showSuccessModal({
            algorithmName: algorithm.name,
            totalMoves: stats.totalMoves,
            efficiency: stats.efficiency,
            duration: stats.duration
        });

        // Dezactivează butoanele de joc
        this.ui.setButtonStates({ start: true, check: false, reset: false });
    }

    /**
     * Resetează jocul curent
     */
    resetGame() {
        if (this.engine.state === GAME_STATES.IDLE) {
            this.ui.showToast('Nu există niciun joc de resetat!', 'error');
            return;
        }

        // Repornește cu același algoritm
        const currentAlgorithmKey = this.engine.currentAlgorithm?.key;
        this.startNewGame(currentAlgorithmKey);
        this.ui.showToast('Joc resetat!', 'info');
    }
}

// Inițializează aplicația când DOM-ul e gata
document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
    app.init();

    // Expune global pentru debugging (opțional)
    window.sortingGame = {
        app,
        engine: gameEngine,
        ui: uiManager
    };
});
