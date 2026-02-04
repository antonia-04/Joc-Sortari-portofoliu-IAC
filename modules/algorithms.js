/**
 * algorithms.js - Strict Algorithm Step Queue Generators
 *
 * Acest modul generează coada de pași necesari pentru fiecare algoritm.
 * Fiecare pas reprezintă o operație pe care utilizatorul trebuie să o execute exact.
 */

/**
 * Informații despre algoritmi în limba română
 */
export const ALGORITHMS = {
    bubble: {
        key: 'bubble',
        name: 'Metoda Bulelor',
        description: 'Compară perechi adiacente de la stânga la dreapta. Dacă elementul din stânga este mai mare, schimbă-le. Continuă până când lista este sortată.',
        rules: [
            'Poți schimba DOAR elemente adiacente (unul lângă altul)',
            'Schimbă doar dacă elementul din stânga > elementul din dreapta',
            'Parcurge de la stânga la dreapta, în ordine'
        ]
    },
    selection: {
        key: 'selection',
        name: 'Metoda Selecției',
        description: 'Găsește elementul minim din partea nesortată și mută-l la începutul părții nesortate.',
        rules: [
            'Găsește cel mai mic element din partea nesortată',
            'Schimbă minimul cu primul element nesortat',
            'Prima poziție nesortată avansează cu 1'
        ]
    },
    insertion: {
        key: 'insertion',
        name: 'Metoda Inserției',
        description: 'Ia fiecare element din partea nesortată și inserează-l în poziția corectă în partea sortată, mutându-l spre stânga.',
        rules: [
            'Elementele din stânga sunt considerate "sortate"',
            'Ia primul element nesortat',
            'Mută-l spre stânga până când ajunge la poziția corectă'
        ]
    }
};

/**
 * Tipuri de pași în algoritm
 */
export const STEP_TYPES = {
    SWAP: 'swap',           // Schimbă două elemente
    COMPARE: 'compare',     // Compară (fără schimbare)
    NO_ACTION: 'no_action'  // Nu e nevoie de acțiune (elementele sunt în ordine)
};

/**
 * Generează coada de pași pentru Bubble Sort
 * @param {number[]} arr - Array-ul de sortat
 * @returns {Object[]} - Coada de pași necesari
 */
export function generateBubbleSortSteps(arr) {
    const steps = [];
    const array = [...arr];
    const n = array.length;

    for (let i = 0; i < n - 1; i++) {
        let swapped = false;

        for (let j = 0; j < n - i - 1; j++) {
            // Adaugă pas de comparare/schimbare
            if (array[j] > array[j + 1]) {
                steps.push({
                    type: STEP_TYPES.SWAP,
                    indices: [j, j + 1],
                    values: [array[j], array[j + 1]],
                    message: `Schimbă ${array[j]} cu ${array[j + 1]} (poziții ${j} și ${j + 1})`,
                    pass: i + 1,
                    position: j
                });

                // Efectuează schimbarea virtual
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
                swapped = true;
            }
        }

        // Dacă nu s-a făcut nicio schimbare în această trecere, array-ul e sortat
        if (!swapped) break;
    }

    return steps;
}

/**
 * Generează coada de pași pentru Selection Sort
 * @param {number[]} arr - Array-ul de sortat
 * @returns {Object[]} - Coada de pași necesari
 */
export function generateSelectionSortSteps(arr) {
    const steps = [];
    const array = [...arr];
    const n = array.length;

    for (let i = 0; i < n - 1; i++) {
        // Găsește minimul din partea nesortată
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (array[j] < array[minIdx]) {
                minIdx = j;
            }
        }

        // Dacă minimul nu e deja la poziția i, adaugă pas de schimbare
        if (minIdx !== i) {
            steps.push({
                type: STEP_TYPES.SWAP,
                indices: [i, minIdx],
                values: [array[i], array[minIdx]],
                message: `Mută minimul ${array[minIdx]} de la poziția ${minIdx} la poziția ${i}`,
                sortedPosition: i,
                minIndex: minIdx
            });

            // Efectuează schimbarea virtual
            [array[i], array[minIdx]] = [array[minIdx], array[i]];
        }
    }

    return steps;
}

/**
 * Generează coada de pași pentru Insertion Sort
 * @param {number[]} arr - Array-ul de sortat
 * @returns {Object[]} - Coada de pași necesari
 */
export function generateInsertionSortSteps(arr) {
    const steps = [];
    const array = [...arr];
    const n = array.length;

    for (let i = 1; i < n; i++) {
        let j = i;

        // Mută elementul spre stânga până ajunge la poziția corectă
        while (j > 0 && array[j - 1] > array[j]) {
            steps.push({
                type: STEP_TYPES.SWAP,
                indices: [j - 1, j],
                values: [array[j - 1], array[j]],
                message: `Mută ${array[j]} spre stânga (schimbă cu ${array[j - 1]})`,
                insertingElement: i,
                currentPosition: j
            });

            // Efectuează schimbarea virtual
            [array[j - 1], array[j]] = [array[j], array[j - 1]];
            j--;
        }
    }

    return steps;
}

/**
 * Generează pașii pentru algoritmul specificat
 * @param {string} algorithmKey - Cheia algoritmului ('bubble', 'selection', 'insertion')
 * @param {number[]} arr - Array-ul de sortat
 * @returns {Object[]} - Coada de pași
 */
export function generateStepsForAlgorithm(algorithmKey, arr) {
    switch (algorithmKey) {
        case 'bubble':
            return generateBubbleSortSteps(arr);
        case 'selection':
            return generateSelectionSortSteps(arr);
        case 'insertion':
            return generateInsertionSortSteps(arr);
        default:
            throw new Error(`Algoritm necunoscut: ${algorithmKey}`);
    }
}

/**
 * Verifică dacă o mutare propusă corespunde cu pasul așteptat
 * @param {Object} expectedStep - Pasul așteptat din coadă
 * @param {number} index1 - Primul index propus
 * @param {number} index2 - Al doilea index propus
 * @returns {boolean} - True dacă mutarea e corectă
 */
export function validateMove(expectedStep, index1, index2) {
    if (!expectedStep) return false;

    const [expectedIdx1, expectedIdx2] = expectedStep.indices;

    // Verifică dacă indicii corespund (în orice ordine)
    return (index1 === expectedIdx1 && index2 === expectedIdx2) ||
           (index1 === expectedIdx2 && index2 === expectedIdx1);
}

/**
 * Generează mesaj de eroare specific algoritmului
 * @param {string} algorithmKey - Cheia algoritmului
 * @param {Object} expectedStep - Pasul așteptat
 * @param {number} index1 - Primul index propus
 * @param {number} index2 - Al doilea index propus
 * @returns {string} - Mesaj de eroare în română
 */
export function getErrorMessage(algorithmKey, expectedStep, index1, index2) {
    if (!expectedStep) {
        return 'Nu mai sunt mutări necesare! Verifică dacă array-ul este sortat.';
    }

    const [expIdx1, expIdx2] = expectedStep.indices;
    const [expVal1, expVal2] = expectedStep.values;

    switch (algorithmKey) {
        case 'bubble':
            if (Math.abs(index1 - index2) !== 1) {
                return `Metoda Bulelor: Poți schimba doar elemente ADIACENTE! Trebuie să schimbi pozițiile ${expIdx1} și ${expIdx2}.`;
            }
            return `Mutare greșită! Conform Metodei Bulelor, trebuie să compari elementele de la pozițiile ${expIdx1} și ${expIdx2} (valorile ${expVal1} și ${expVal2}).`;

        case 'selection':
            return `Mutare greșită! Conform Metodei Selecției, trebuie să muți minimul (${expVal2}) de la poziția ${expIdx2} la poziția ${expIdx1}.`;

        case 'insertion':
            return `Mutare greșită! Conform Metodei Inserției, trebuie să muți elementul ${expVal2} de la poziția ${expIdx2} spre stânga, schimbându-l cu ${expVal1}.`;

        default:
            return `Mutare greșită! Trebuie să schimbi elementele de la pozițiile ${expIdx1} și ${expIdx2}.`;
    }
}

/**
 * Returnează indicația pentru următoarea mutare
 * @param {string} algorithmKey - Cheia algoritmului
 * @param {Object} nextStep - Următorul pas din coadă
 * @returns {string} - Indicație în română
 */
export function getNextMoveHint(algorithmKey, nextStep) {
    if (!nextStep) {
        return 'Array-ul este sortat! Apasă "Verifică Soluția".';
    }

    const [idx1, idx2] = nextStep.indices;
    const [val1, val2] = nextStep.values;

    switch (algorithmKey) {
        case 'bubble':
            return `Compară pozițiile ${idx1} și ${idx2}: schimbă ${val1} cu ${val2}`;

        case 'selection':
            return `Găsește minimul (${val2}) și mută-l la poziția ${idx1}`;

        case 'insertion':
            return `Inserează ${val2}: schimbă cu ${val1} (poziția ${idx1})`;

        default:
            return `Schimbă pozițiile ${idx1} și ${idx2}`;
    }
}
