const PerformanceAnalyzer = require('../utils/PerformanceAnalyser');
const Cache = require('../utils/cache');


class AnalyzeController {
    static async analyzePerformance(request, h) {
        try {
            const { joinId } = request.payload;
            const result = await JoinController.retrieveJoinResult(joinId);
            
            const analyzer = new PerformanceAnalyzer();
            const report = analyzer.generateReport();

            return h.response(report).code(200);
        } catch (error) {
            return h.response({
                error: 'Failed to analyze performance',
                details: error.message
            }).code(500);
        }
    }
}

module.exports = AnalyzeController;