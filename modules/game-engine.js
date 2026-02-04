/**
 * game-engine.js - Motor de joc și gestionarea stării
 *
 * Acest modul gestionează toată logica jocului, inclusiv:
 * - Starea curentă a jocului
 * - Coada de pași
 * - Validarea mutărilor
 * - Statistici
 */

import {
    ALGORITHMS,
    generateStepsForAlgorithm,
    validateMove,
    getErrorMessage,
    getNextMoveHint
} from './algorithms.js';

/**
 * Stările posibile ale jocului
 */
export const GAME_STATES = {
    IDLE: 'idle',           // Jocul nu a început
    PLAYING: 'playing',     // Jocul este în desfășurare
    COMPLETED: 'completed', // Jocul s-a terminat cu succes
    PAUSED: 'paused'        // Jocul este în pauză
};

/**
 * Clasa principală pentru motorul de joc
 */
export class GameEngine {
    constructor() {
        this.reset();
    }

    /**
     * Resetează complet starea jocului
     */
    reset() {
        this.state = GAME_STATES.IDLE;
        this.numbers = [];
        this.originalNumbers = [];
        this.currentAlgorithm = null;
        this.stepQueue = [];
        this.currentStepIndex = 0;
        this.selectedIndex = null;
        this.stats = {
            totalMoves: 0,
            correctMoves: 0,
            incorrectMoves: 0,
            startTime: null,
            endTime: null
        };
    }

    /**
     * Generează numere aleatorii unice
     * @param {number} count - Numărul de elemente (5-7)
     * @param {number} min - Valoare minimă
     * @param {number} max - Valoare maximă
     * @returns {number[]} - Array de numere unice
     */
    generateRandomNumbers(count = null, min = 1, max = 20) {
        // Dacă nu e specificat, generează între 5 și 7 elemente
        const numCount = count || Math.floor(Math.random() * 3) + 5;
        const numbers = new Set();

        while (numbers.size < numCount) {
            numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
        }

        const arr = Array.from(numbers);

        // Amestecă array-ul
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }

        // Verifică că nu e deja sortat
        const isSorted = arr.every((val, idx) => idx === 0 || val >= arr[idx - 1]);
        if (isSorted) {
            // Dacă e sortat, amestecă primele două elemente
            [arr[0], arr[1]] = [arr[1], arr[0]];
        }

        return arr;
    }

    /**
     * Selectează un algoritm aleatoriu
     * @returns {Object} - Obiectul algoritmului selectat
     */
    selectRandomAlgorithm() {
        const keys = Object.keys(ALGORITHMS);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return ALGORITHMS[randomKey];
    }

    /**
     * Inițializează un joc nou
     * @param {string} algorithmKey - Cheia algoritmului (opțional, altfel aleatoriu)
     * @returns {Object} - Informații despre jocul nou
     */
    startNewGame(algorithmKey = null) {
        this.reset();

        // Selectează algoritmul
        if (algorithmKey && ALGORITHMS[algorithmKey]) {
            this.currentAlgorithm = ALGORITHMS[algorithmKey];
        } else {
            this.currentAlgorithm = this.selectRandomAlgorithm();
        }

        // Generează numere aleatorii
        this.numbers = this.generateRandomNumbers();
        this.originalNumbers = [...this.numbers];

        // Generează coada de pași
        this.stepQueue = generateStepsForAlgorithm(
            this.currentAlgorithm.key,
            [...this.numbers]
        );
        this.currentStepIndex = 0;

        // Actualizează starea
        this.state = GAME_STATES.PLAYING;
        this.stats.startTime = Date.now();

        return {
            numbers: this.numbers,
            algorithm: this.currentAlgorithm,
            totalSteps: this.stepQueue.length,
            firstHint: this.getNextMoveHint()
        };
    }

    /**
     * Selectează/Deselectează un element
     * @param {number} index - Indexul elementului selectat
     * @returns {Object} - Rezultatul selecției
     */
    selectElement(index) {
        if (this.state !== GAME_STATES.PLAYING) {
            return { success: false, message: 'Jocul nu este activ!' };
        }

        if (index < 0 || index >= this.numbers.length) {
            return { success: false, message: 'Index invalid!' };
        }

        // Dacă nu e nimic selectat, selectează elementul
        if (this.selectedIndex === null) {
            this.selectedIndex = index;
            return {
                success: true,
                action: 'selected',
                selectedIndex: index,
                message: `Selectat ${this.numbers[index]}. Alege alt element pentru schimbare.`
            };
        }

        // Dacă e același element, deselectează
        if (this.selectedIndex === index) {
            this.selectedIndex = null;
            return {
                success: true,
                action: 'deselected',
                message: 'Selecție anulată.'
            };
        }

        // Altfel, încearcă să facă swap
        const firstIndex = this.selectedIndex;
        const secondIndex = index;
        this.selectedIndex = null;

        return this.attemptSwap(firstIndex, secondIndex);
    }

    /**
     * Încearcă să execute o schimbare
     * @param {number} index1 - Primul index
     * @param {number} index2 - Al doilea index
     * @returns {Object} - Rezultatul încercării
     */
    attemptSwap(index1, index2) {
        if (this.state !== GAME_STATES.PLAYING) {
            return {
                success: false,
                correct: false,
                message: 'Jocul nu este activ!'
            };
        }

        this.stats.totalMoves++;

        // Verifică dacă mai sunt pași de făcut
        const expectedStep = this.stepQueue[this.currentStepIndex];

        if (!expectedStep) {
            // Dacă nu mai sunt pași, verifică dacă e sortat
            if (this.isSorted()) {
                this.completeGame();
                return {
                    success: true,
                    correct: true,
                    completed: true,
                    message: 'Felicitări! Array-ul este deja sortat!'
                };
            }
            return {
                success: false,
                correct: false,
                message: 'Nu mai sunt mutări necesare. Verifică soluția!'
            };
        }

        // Validează mutarea
        const isCorrect = validateMove(expectedStep, index1, index2);

        if (isCorrect) {
            // Mutare corectă - execută swap-ul
            this.stats.correctMoves++;
            [this.numbers[index1], this.numbers[index2]] =
                [this.numbers[index2], this.numbers[index1]];

            this.currentStepIndex++;

            // Verifică dacă s-a terminat
            const isComplete = this.currentStepIndex >= this.stepQueue.length;
            if (isComplete) {
                this.completeGame();
            }

            return {
                success: true,
                correct: true,
                completed: isComplete,
                indices: [index1, index2],
                message: 'Corect! Continuă.',
                nextHint: this.getNextMoveHint(),
                progress: this.getProgress()
            };
        } else {
            // Mutare greșită
            this.stats.incorrectMoves++;
            const errorMessage = getErrorMessage(
                this.currentAlgorithm.key,
                expectedStep,
                index1,
                index2
            );

            return {
                success: false,
                correct: false,
                indices: [index1, index2],
                expectedIndices: expectedStep.indices,
                message: errorMessage,
                hint: this.getNextMoveHint()
            };
        }
    }

    /**
     * Marchează jocul ca finalizat
     */
    completeGame() {
        this.state = GAME_STATES.COMPLETED;
        this.stats.endTime = Date.now();
    }

    /**
     * Verifică dacă array-ul este sortat
     * @returns {boolean}
     */
    isSorted() {
        return this.numbers.every((val, idx) =>
            idx === 0 || val >= this.numbers[idx - 1]
        );
    }

    /**
     * Obține indicația pentru următoarea mutare
     * @returns {string}
     */
    getNextMoveHint() {
        const nextStep = this.stepQueue[this.currentStepIndex];
        return getNextMoveHint(this.currentAlgorithm?.key, nextStep);
    }

    /**
     * Obține pasul curent așteptat
     * @returns {Object|null}
     */
    getCurrentExpectedStep() {
        return this.stepQueue[this.currentStepIndex] || null;
    }

    /**
     * Obține progresul curent
     * @returns {Object}
     */
    getProgress() {
        const total = this.stepQueue.length;
        const completed = this.currentStepIndex;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            completed,
            total,
            percentage,
            remaining: total - completed
        };
    }

    /**
     * Obține statisticile jocului
     * @returns {Object}
     */
    getStats() {
        const duration = this.stats.endTime
            ? (this.stats.endTime - this.stats.startTime) / 1000
            : this.stats.startTime
                ? (Date.now() - this.stats.startTime) / 1000
                : 0;

        const efficiency = this.stats.totalMoves > 0
            ? Math.round((this.stats.correctMoves / this.stats.totalMoves) * 100)
            : 100;

        return {
            ...this.stats,
            duration: Math.round(duration),
            efficiency
        };
    }

    /**
     * Obține starea curentă pentru UI
     * @returns {Object}
     */
    getGameState() {
        return {
            state: this.state,
            numbers: [...this.numbers],
            algorithm: this.currentAlgorithm,
            selectedIndex: this.selectedIndex,
            progress: this.getProgress(),
            stats: this.getStats(),
            currentHint: this.getNextMoveHint(),
            expectedStep: this.getCurrentExpectedStep()
        };
    }

    /**
     * Schimbă algoritmul (resetează jocul)
     * @param {string} algorithmKey - Cheia noului algoritm
     * @returns {Object}
     */
    changeAlgorithm(algorithmKey) {
        if (ALGORITHMS[algorithmKey]) {
            return this.startNewGame(algorithmKey);
        }
        throw new Error(`Algoritm necunoscut: ${algorithmKey}`);
    }

    /**
     * Obține lista de algoritmi disponibili
     * @returns {Object[]}
     */
    static getAvailableAlgorithms() {
        return Object.values(ALGORITHMS);
    }
}

// Exportă instanța singleton pentru utilizare globală
export const gameEngine = new GameEngine();
