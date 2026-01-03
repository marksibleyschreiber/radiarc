class BufferedQueue {
    constructor(size = 16) {
        this.buffer = new Array(size);
        this.head = 0;
        this.tail = 0;
        this.size = size;
        this.length = 0;
    }

    enqueue(element) {
        if (this.length === this.size) {
            // Resize the buffer if it's full
            this.resize();
        }
        this.buffer[this.tail] = element;
        this.tail = (this.tail + 1) % this.size;
        this.length++;
    }

    dequeue() {
        if (this.length === 0) {
            throw new Error("Queue is empty");
        }
        const value = this.buffer[this.head];
        this.buffer[this.head] = undefined; // Prevent memory leak
        this.head = (this.head + 1) % this.size;
        this.length--;
        return value;
    }

    resize() {
        const newBuffer = new Array(this.size * 2);
        for (let i = 0; i < this.length; i++) {
            newBuffer[i] = this.buffer[(this.head + i) % this.size];
        }
        this.buffer = newBuffer;
        this.head = 0;
        this.tail = this.length;
        this.size *= 2;
    }
}