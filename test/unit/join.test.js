// // tests/join.test.js
// const request = require('supertest');
// const {init} = require('../../src/server');
// const { Relation, JoinTree } = require('../../src/models/joinTree');

// describe('Join Endpoint Tests', () => {
//     let server;

//     beforeAll(async () => {
//         // src/server.js
//         'use strict';

//         const Hapi = require('@hapi/hapi');
//         const routes = require('../../src/routes/joins');

//         const init = async () => {
//             const server = Hapi.server({
//                 port: 3010,
//                 host: 'localhost',
//                 routes: {
//                     cors: true
//                 }
//             });

//             // Register routes
//             server.route(routes);

//             await server.start();
//             console.log('Server running on %s', server.info.uri);
//         };

//         process.on('unhandledRejection', (err) => {
//             console.log(err);
//             process.exit(1);
//         });

//         init();

//     });



//     describe('POST /api/join', () => {
//         it('should successfully process a simple join request', async () => {
//             const joinRequest = {
//                 joinTree: {
//                     relation: {
//                         name: "Orders",
//                         attributes: ["order_id", "customer_id", "date"],
//                         tuples: [
//                             [1, 101, "2024-01-01"],
//                             [2, 102, "2024-01-02"]
//                         ],
//                         selections: [{
//                             attribute: "date",
//                             operator: ">=",
//                             value: "2024-01-01"
//                         }]
//                     },
//                     left: {
//                         relation: {
//                             name: "Customers",
//                             attributes: ["customer_id", "name"],
//                             tuples: [
//                                 [101, "John Doe"],
//                                 [102, "Jane Smith"]
//                             ]
//                         }
//                     }
//                 }
//             };

//             const response = await request(server)
//                 .post('/api/join')
//                 .send(joinRequest)
//                 .expect(200);

//             expect(response.body).toHaveProperty('result');
//             expect(response.body.result.tuples).toHaveLength(2);
//         });

//         it('should handle empty relations', async () => {
//             const joinRequest = {
//                 joinTree: {
//                     relation: {
//                         name: "Orders",
//                         attributes: ["order_id", "customer_id"],
//                         tuples: []
//                     },
//                     left: {
//                         relation: {
//                             name: "Customers",
//                             attributes: ["customer_id", "name"],
//                             tuples: []
//                         }
//                     }
//                 }
//             };

//             const response = await request(server)
//                 .post('/api/join')
//                 .send(joinRequest)
//                 .expect(200);

//             expect(response.body.result.tuples).toHaveLength(0);
//         });

//         it('should handle complex join with selections and projections', async () => {
//             const joinRequest = {
//                 joinTree: {
//                     relation: {
//                         name: "Orders",
//                         attributes: ["order_id", "customer_id", "date"],
//                         tuples: [
//                             [1, 101, "2024-01-01"],
//                             [2, 102, "2024-01-02"]
//                         ],
//                         selections: [{
//                             attribute: "date",
//                             operator: ">=",
//                             value: "2024-01-01"
//                         }]
//                     },
//                     left: {
//                         relation: {
//                             name: "OrderDetails",
//                             attributes: ["order_id", "product_id", "quantity"],
//                             tuples: [
//                                 [1, 201, 2],
//                                 [2, 202, 1]
//                             ]
//                         },
//                         selections: [{
//                             attribute: "quantity",
//                             operator: ">",
//                             value: 1
//                         }]
//                     },
//                     projections: ["order_id", "date", "quantity"]
//                 }
//             };

//             const response = await request(server)
//                 .post('/api/join')
//                 .send(joinRequest)
//                 .expect(200);

//             // Verify projections
//             expect(Object.keys(response.body.result.tuples[0])).toEqual(
//                 expect.arrayContaining(["order_id", "date", "quantity"])
//             );

//             // Verify selections were applied
//             expect(response.body.result.tuples.every(t => t.quantity > 1)).toBeTruthy();
//         });

//         it('should handle invalid join requests', async () => {
//             const invalidRequest = {
//                 joinTree: {
//                     relation: {
//                         // Missing required fields
//                         name: "Orders"
//                     }
//                 }
//             };

//             const response = await request(server)
//                 .post('/api/join')
//                 .send(invalidRequest)
//                 .expect(400);

//             expect(response.body).toHaveProperty('error');
//         });

//         it('should process multi-way joins correctly', async () => {
//             const joinRequest = {
//                 joinTree: {
//                     relation: {
//                         name: "Orders",
//                         attributes: ["order_id", "customer_id"],
//                         tuples: [[1, 101], [2, 102]]
//                     },
//                     left: {
//                         relation: {
//                             name: "Customers",
//                             attributes: ["customer_id", "name"],
//                             tuples: [[101, "John"], [102, "Jane"]]
//                         },
//                         right: {
//                             relation: {
//                                 name: "Regions",
//                                 attributes: ["customer_id", "region"],
//                                 tuples: [[101, "North"], [102, "South"]]
//                             }
//                         }
//                     }
//                 }
//             };

//             const response = await request(server)
//                 .post('/api/join')
//                 .send(joinRequest)
//                 .expect(200);

//             expect(response.body.result.tuples).toHaveLength(2);
//             expect(response.body.result.tuples[0]).toHaveProperty('region');
//         });

//         it('should handle performance with larger datasets', async () => {
//             // Generate larger test data
//             const largeOrdersData = Array.from({ length: 1000 }, (_, i) => [
//                 i + 1, 
//                 Math.floor(i/10) + 1, 
//                 `2024-01-${String(i % 30 + 1).padStart(2, '0')}`
//             ]);

//             const largeCustomersData = Array.from({ length: 100 }, (_, i) => [
//                 i + 1,
//                 `Customer ${i + 1}`
//             ]);

//             const joinRequest = {
//                 joinTree: {
//                     relation: {
//                         name: "Orders",
//                         attributes: ["order_id", "customer_id", "date"],
//                         tuples: largeOrdersData
//                     },
//                     left: {
//                         relation: {
//                             name: "Customers",
//                             attributes: ["customer_id", "name"],
//                             tuples: largeCustomersData
//                         }
//                     }
//                 }
//             };

//             const startTime = Date.now();
//             const response = await request(server)
//                 .post('/api/join')
//                 .send(joinRequest)
//                 .expect(200);
//             const endTime = Date.now();

//             expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
//             expect(response.body.result.tuples.length).toBeGreaterThan(0);
//         });
//     });
// });