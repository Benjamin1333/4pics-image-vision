/**
 * @param labelPath {string}
 * @returns {Promise<Label[]>}
 */
async function loadLabels(labelPath) {
    const json = await (await fetch(labelPath)).json();
    /**@type{{description: string, score: float, topicality: float}[]}*/
    const jsonResponse = json['responses'][0];
    if (!('labelAnnotations' in jsonResponse)) {
        return [];
    }
    return jsonResponse['labelAnnotations'].map(({description, score, topicality}) => {
        return new Label(description, score, topicality);
    });
}

/** @returns {Promise<Puzzle[]>}*/
async function loadPuzzles() {
    /**@type {{id: number, solution: string}[]}*/
    const puzzlesJson = await (await fetch('./asset/puzzles_en_sample.json')).json();

    /**@type {Puzzle[]}*/
    const puzzles = [];
    for ({id, solution} of puzzlesJson) {
        const images = [];
        for (let i = 1; i <= 4; i++) {
            const labels = await loadLabels(`./asset/metadata/_${id}_${i}.labels.json`);
            images.push(new PuzzleImage(id, `./asset/image/_${id}_${i}.jpg`, labels));
        }
        puzzles.push(new Puzzle(id, solution, images));
    }

    return puzzles.sort((a, b) => a.id - b.id).reverse();
}

const state = {
    /**@type {Puzzle[]}*/
    puzzles: [],
    /**@returns {PuzzleImage[]}*/
    images: [],
    /**@type {float}*/
    minScore: 0.0,
    /**@type {float}*/
    minTopicality: 0.0,
    /**@type {string}*/
    userInput: '',
    /**@type {Label[]}*/
    labels: [],
    /**@type {string[]}*/
    selectedLabels: [],
    /**@type {Puzzle}*/
    selectedPuzzle: null,
    statistics: {
        puzzleCount: 0,
        imageCount: 0,
        labelCount: 0,
        unlabeledImages: 0,
        topicalityMissingLabelsCount: 0,
        averageScore: 0,
        averageTopicality: 0
    },

    /**@returns {PuzzleImage[]}*/
    get filteredImages() {
        return this.images.filter(image => {
            if (this.selectedLabels.length === 0) {
                return true;
            }
            return this.selectedLabels.every(selectedLabel => {
                return image.labels.some(label => label.description === selectedLabel);
            })
        })
    },

    get filteredLabels() {
        const filtered = this.labels.filter(label => {
            const isSelected = this.selectedLabels.indexOf(label.description) > -1
            if (isSelected) {
                return false;
            }
            if (label.score < this.minScore) {
                return false;
            }
            if (label.topicality < this.minTopicality) {
                return false;
            }
            if (this.userInput.length === 0) {
                return true
            }

            return label.description.toLowerCase().includes(this.userInput.toLowerCase());
        }).map(label => label.description);
        return new Array(...new Set(filtered));
    },

    init: async function () {
        this.puzzles = await loadPuzzles()
        this.images = this.puzzles.flatMap((puzzle) => puzzle.images);
        this.labels = this.images.flatMap(image => image.labels);
        this.statistics.puzzleCount = this.puzzles.length;
        this.statistics.imageCount = this.images.length;
        this.statistics.labelCount = this.labels.length;
        this.statistics.unlabeledImages = this.images.filter(image => image.labels.length === 0);
        this.statistics.topicalityMissingLabelsCount = this.labels.filter(label => label.topicality == null).length;
        this.statistics.averageScore = (() => {
            const scoreList = this.labels.map((label => label.score)).filter(value => value);
            const sum = scoreList.reduce((sum, value) => sum += value, 0.0);
            return sum / scoreList.length;
        })();
        this.statistics.averageTopicality = (() => {
            const topicalityList = this.labels.map((label => label.topicality)).filter(value => value);
            const sum = topicalityList.reduce((sum, value) => sum += value, 0.0);
            return sum / topicalityList.length;
        })();
    },

    /**@param label {string}*/
    selectLabel(label) {
        this.selectedLabels.push(label);
    },

    /**@param label {string}*/
    unselectLabel(label) {
        this.selectedLabels = this.selectedLabels.filter(selectedLabel => selectedLabel !== label);
    },

    /**@param puzzleId {int}*/
    selectPuzzle(puzzleId) {
        this.selectedPuzzle = this.puzzles.find(p => p.id === puzzleId);
    },

    /**
     * @param minScore {float}
     * @returns int*/
    minScoreCount(minScore) {
        return this.labels.filter(label => label.score >= minScore).length;
    },

    /**
     * @param minTopicality {float}
     * @returns int*/
    minTopicalityCount(minTopicality) {
        return this.labels.filter(label => label.topicality >= minTopicality).length;
    }

}

document.addEventListener('alpine:init', () => {
    console.log('alpine:init');
    Alpine.data('state', () => state);
});