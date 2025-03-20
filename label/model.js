class Puzzle {
    /**
     * @param id {int}
     * @param solution {string}
     * @param images {PuzzleImage[]}
     */
    constructor(id, solution, images) {
        this.id = id;
        this.solution = solution;
        this.images = images;
    }
}

class PuzzleImage{
    /**
     * @param puzzleId {int}
     * @param image {string}
     * @param labels {Label[]}
     */
    constructor(puzzleId, image, labels) {
        this.puzzleId = puzzleId;
        this.image = image;
        this.labels = labels;
    }
}

class Label {
    /**
     * @param description {string}
     * @param score {float}
     * @param topicality {float}
     */
    constructor(description, score, topicality) {
        this.description = description;
        this.score = score;
        this.topicality = topicality;
    }
}