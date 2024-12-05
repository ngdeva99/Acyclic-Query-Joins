// test/ecommerce.test.js
const YannakakisProcessor = require('../src/processors/yannakakis');

function generateTestData(scale = 1000) {
    const categories = [], sellers = [], products = [], reviews = [];
    
    // Generate Categories (with parent relationships)
    for (let i = 0; i < scale/10; i++) {
        categories.push({
            category_id: i,
            name: `Category ${i}`,
            parent_category_id: i > 10 ? Math.floor(Math.random() * 10) : null
        });
    }
    
    // Generate Sellers (30% inactive)
    for (let i = 0; i < scale/5; i++) {
        sellers.push({
            seller_id: i,
            name: `Seller ${i}`,
            region_id: Math.floor(Math.random() * 10)
        });
    }
    
    // Generate Products (with intentional dangling references)
    for (let i = 0; i < scale; i++) {
        const hasSeller = Math.random() > 0.1;  // 10% orphaned products
        const hasCategory = Math.random() > 0.1; // 10% uncategorized products
        
        products.push({
            product_id: i,
            title: `Product ${i}`,
            category_id: hasCategory ? 
                Math.floor(Math.random() * categories.length) :
                categories.length + 1,  // Invalid category
            seller_id: hasSeller ?
                Math.floor(Math.random() * sellers.length) :
                sellers.length + 1  // Invalid seller
        });
    }
    
    // Generate Reviews (50% products will have no reviews)
    const reviewedProducts = new Set();
    for (let i = 0; i < scale * 2; i++) {
        const product_id = Math.floor(Math.random() * products.length);
        reviewedProducts.add(product_id);
        
        reviews.push({
            review_id: i,
            product_id: product_id,
            user_id: Math.floor(Math.random() * (scale/2)),
            rating: Math.floor(Math.random() * 5) + 1
        });
    }
    
    return { categories, sellers, products, reviews, reviewedProducts };
}

const { Relation, JoinTree } = require('../src/models/joinTree');

describe('Yannakakis Algorithm E-commerce Test', () => {
    let testData;
    
    beforeAll(() => {
        testData = generateTestData(1000);
    });
    
    test('Should eliminate dangling tuples in bottom-up phase', () => {
        // Create relations using the Relation class
        const productsRel = new Relation(
            "Products",
            new Set(["product_id", "category_id", "seller_id", "title"]),
            testData.products.map(p => [p.product_id, p.category_id, p.seller_id, p.title])
        );
        
        const categoriesRel = new Relation(
            "Categories",
            new Set(["category_id", "name", "parent_category_id"]),
            testData.categories.map(c => [c.category_id, c.name, c.parent_category_id])
        );
        
        const sellersRel = new Relation(
            "Sellers",
            new Set(["seller_id", "name", "region_id"]),
            testData.sellers.map(s => [s.seller_id, s.name, s.region_id])
        );

        // Create join tree structure matching the processor's expectations
        const joinTree = new JoinTree();
        joinTree.root = {
            relation: productsRel,
            left: {
                relation: categoriesRel
            },
            right: {
                relation: sellersRel
            }
        };
        
        const processor = new YannakakisProcessor();
        const bottomUpResult = YannakakisProcessor.bottomUpPhase(joinTree.root);
        
        console.log('Bottom-up phase reductions:', {
            products: {
                original: testData.products.length,
                reduced: bottomUpResult.relation.tuples.length,
                reduction: `${((1 - bottomUpResult.relation.tuples.length/testData.products.length) * 100).toFixed(2)}%`
            }
        });
        
        const validCategories = new Set(testData.categories.map(c => c.category_id));
        const validSellers = new Set(testData.sellers.map(s => s.seller_id));
        
        const allValid = bottomUpResult.relation.tuples.every(product => 
            validCategories.has(product[1]) && 
            validSellers.has(product[2])
        );
        
        expect(allValid).toBe(true);
        expect(bottomUpResult.relation.tuples.length).toBeLessThan(testData.products.length);
    });
    
    test('Should handle multi-way join with reviews', () => {
        const joinTree = new JoinTree();
        joinTree.root = {
            relation: new Relation(
                "Products",
                new Set(["product_id", "category_id", "seller_id", "title"]),
                testData.products.map(p => [p.product_id, p.category_id, p.seller_id, p.title])
            ),
            left: {
                relation: new Relation(
                    "Categories",
                    new Set(["category_id", "name", "parent_category_id"]),
                    testData.categories.map(c => [c.category_id, c.name, c.parent_category_id])
                )
            },
            right: {
                relation: new Relation(
                    "Reviews",
                    new Set(["review_id", "product_id", "user_id", "rating"]),
                    testData.reviews.map(r => [r.review_id, r.product_id, r.user_id, r.rating])
                )
            }
        };
        
        const processor = new YannakakisProcessor();
        const result = YannakakisProcessor.process(joinTree);
        
        console.log('Multi-way join results:', {
            totalProducts: testData.products.length,
            totalReviews: testData.reviews.length,
            productsWithReviews: testData.reviewedProducts.size,
            finalJoinSize: result.tuples.length
        });
        
        expect(result.tuples.length).toBeLessThanOrEqual(testData.reviews.length);
        expect(result.tuples.length).toBeGreaterThan(0);
    });
    
    test('Should handle hierarchical category joins', () => {
        const joinTree = new JoinTree();
        joinTree.root = {
            relation: new Relation(
                "Products",
                new Set(["product_id", "category_id", "seller_id", "title"]),
                testData.products.map(p => [p.product_id, p.category_id, p.seller_id, p.title])
            ),
            left: {
                relation: new Relation(
                    "Categories",
                    new Set(["category_id", "name", "parent_category_id"]),
                    testData.categories.map(c => [c.category_id, c.name, c.parent_category_id])
                ),
                right: {
                    relation: new Relation(
                        "ParentCategories",
                        new Set(["category_id", "name", "parent_category_id"]),
                        testData.categories
                            .filter(c => c.parent_category_id !== null)
                            .map(c => [c.category_id, c.name, c.parent_category_id])
                    )
                }
            }
        };
        
        const processor = new YannakakisProcessor();
        const result = YannakakisProcessor.process(joinTree);
        
        console.log('Category hierarchy joins:', {
            totalCategories: testData.categories.length,
            categoriesWithParent: testData.categories.filter(c => c.parent_category_id !== null).length,
            productsInHierarchy: result.tuples.length
        });
        
        expect(result.tuples.length).toBeLessThanOrEqual(testData.products.length);
    });
});