class PerformanceAnalyzer {
    constructor() {
      this.metrics = {
        executionTimes: [],
        memoryUsage: [],
        intermediateResults: []
      };
    }
  
    async benchmarkSequence(sequence) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      const result = await sequence.execute();
      
      this.metrics.executionTimes.push(performance.now() - startTime);
      this.metrics.memoryUsage.push(process.memoryUsage().heapUsed - startMemory);
      this.metrics.intermediateResults.push(sequence.getIntermediateResults());
      
      return result;
    }
  
    generateReport() {
      return {
        averageExecutionTime: this.calculateAverage(this.metrics.executionTimes),
        peakMemoryUsage: Math.max(...this.metrics.memoryUsage),
        averageIntermediateSize: this.calculateAverage(this.metrics.intermediateResults)
      };
    }
  
    calculateAverage(array) {
      return array.reduce((a, b) => a + b, 0) / array.length;
    }
  }
  
  module.exports = PerformanceAnalyzer;