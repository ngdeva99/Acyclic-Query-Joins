// tests/helpers/testData.js
class TestDataGenerator {
    static generateOrders(count) {
        return Array.from({ length: count }, (_, i) => ({
            order_id: i + 1,
            customer_id: Math.floor(i/10) + 1,
            date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`
        }));
    }

    static generateCustomers(count) {
        return Array.from({ length: count }, (_, i) => ({
            customer_id: i + 1,
            name: `Customer ${i + 1}`
        }));
    }

    static generateOrderDetails(count) {
        return Array.from({ length: count }, (_, i) => ({
            order_id: i + 1,
            product_id: Math.floor(Math.random() * 10) + 1,
            quantity: Math.floor(Math.random() * 5) + 1
        }));
    }
}

module.exports = TestDataGenerator;