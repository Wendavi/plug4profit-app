
// A simple request queue to manage API calls and prevent rate-limiting errors.
type RequestFn<T> = () => Promise<T>;

interface QueuedRequest<T> {
    requestFn: RequestFn<T>;
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
    retries: number;
}

class ApiRequestQueue {
    private queue: QueuedRequest<any>[] = [];
    private isProcessing = false;
    private isPaused = false;
    private readonly requestDelay = 1200; // Delay between requests in ms, for a safe 50 RPM.
    private readonly pauseDuration = 30000; // Pause for 30 seconds on quota error.
    private readonly maxRetries = 3;

    /**
     * Adds a request to the queue.
     * @param requestFn A function that returns the promise from the API call.
     * @returns A promise that resolves or rejects when the request is processed.
     */
    public add<T>(requestFn: RequestFn<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject, retries: 0 });
            if (!this.isProcessing && !this.isPaused) {
                this.processNext();
            }
        });
    }

    private async processNext(): Promise<void> {
        if (this.queue.length === 0 || this.isPaused) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const currentRequest = this.queue.shift()!;
        const { requestFn, resolve, reject, retries } = currentRequest;

        try {
            const result = await requestFn();
            resolve(result);
            // After success, process the next item after a delay.
            setTimeout(() => this.processNext(), this.requestDelay);
        } catch (error: any) {
            const errorMsg = error.toString();
            const isQuotaError = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED');
            const isServerError = errorMsg.includes('500') || errorMsg.includes('Internal Server Error') || errorMsg.includes('503');
            
            if (isQuotaError) {
                // A quota error occurred. We will pause and retry.
                const pauseMessage = `API-quotum bereikt. Verzoeken worden ${this.pauseDuration / 1000} seconden gepauzeerd en daarna opnieuw geprobeerd.`;
                console.warn(pauseMessage);

                // Put the failed request back at the front of the queue.
                this.queue.unshift(currentRequest);
                
                // Pause processing.
                this.isPaused = true;
                this.isProcessing = false;
                
                // Set a timer to resume processing.
                setTimeout(() => {
                    this.isPaused = false;
                    console.log("Hervat de API-verzoekwachtrij.");
                    this.processNext(); // This will re-attempt the failed request.
                }, this.pauseDuration);

            } else if (isServerError && retries < this.maxRetries) {
                // Transient server error (500/503). Retry with backoff.
                console.warn(`Server error detected (Attempt ${retries + 1}/${this.maxRetries}). Retrying...`, error);
                
                currentRequest.retries++;
                this.queue.unshift(currentRequest);
                
                // Exponential backoff: 1s, 2s, 4s
                const retryDelay = 1000 * Math.pow(2, currentRequest.retries);
                
                setTimeout(() => {
                    this.processNext();
                }, retryDelay);
            } else {
                // For other non-recoverable errors, or if max retries exceeded, reject.
                console.error("API Request failed permanently:", error);
                reject(error);
                setTimeout(() => this.processNext(), this.requestDelay);
            }
        }
    }
}

export const apiQueue = new ApiRequestQueue();
