// src/data/enhancedJobLoader.js
const fs = require('fs');
const csv = require('csv-parse');
const { Relation } = require('../models/joinTree');

class EnhancedJobLoader {
    // Static maps for ID tracking
    static companyMap = new Map();
    static locationMap = new Map();
    static salaryRangeMap = new Map();
    static experienceLevelMap = new Map();
    static jobCategoryMap = new Map();
    static industryMap = new Map();
    static skillMap = new Map();

    static async loadData(filePath, chunkSize = null) {
        console.log('Starting data loading process...');
        
        // Clear all maps before loading new data
        this.clearAllMaps();
        
        // Load and preprocess raw data
        const rawJobs = await this.loadRawJobs(filePath, chunkSize);
        console.log(`Loaded ${rawJobs.length} raw job entries`);

        // Transform data into normalized relations
        console.log('Transforming raw data into normalized relations...');
        const relations = await this.transformData(rawJobs);
        
        // Calculate statistics
        const stats = this.calculateDatasetStatistics(relations);
        
        return {
            ...relations,
            stats
        };
    }

    static clearAllMaps() {
        this.companyMap.clear();
        this.locationMap.clear();
        this.salaryRangeMap.clear();
        this.experienceLevelMap.clear();
        this.jobCategoryMap.clear();
        this.industryMap.clear();
        this.skillMap.clear();
    }

    static async loadRawJobs(filePath, chunkSize) {
        return new Promise((resolve, reject) => {
            const jobs = [];
            let rowCount = 0;

            fs.createReadStream(filePath)
                .pipe(csv.parse({ 
                    columns: true, 
                    skip_empty_lines: true,
                    trim: true
                }))
                .on('data', (row) => {
                    if (!chunkSize || rowCount < chunkSize) {
                        jobs.push(this.preprocessRow(row));
                        rowCount++;
                    }
                })
                .on('end', () => resolve(jobs))
                .on('error', reject);
        });
    }

    static async transformData(rawJobs) {
        // Create base relations in specific order to maintain referential integrity
        const companies = this.createCompaniesRelation(rawJobs);
        const locations = this.createLocationsRelation(rawJobs);
        const skills = this.createSkillsRelation(rawJobs);
        const salaryRanges = this.createSalaryRangesRelation(rawJobs);
        const experienceLevels = this.createExperienceLevelsRelation(rawJobs);
        const jobCategories = this.createJobCategoriesRelation(rawJobs);
        const industries = this.createIndustriesRelation(rawJobs);

        // Create dependent relations
        const jobs = this.createJobsRelation(rawJobs);
        const jobSkills = this.createJobSkillsRelation(rawJobs);
        const companyIndustries = this.createCompanyIndustriesRelation(rawJobs);

        return {
            jobs,
            companies,
            locations,
            skills,
            salaryRanges,
            jobSkills,
            industries,
            jobCategories,
            experienceLevels,
            companyIndustries
        };
    }

    static createJobsRelation(rawJobs) {
        return new Relation(
            'jobs',
            ['job_id', 'title', 'company_id', 'location_id', 'salary_range_id', 'experience_level_id', 'category_id'],
            rawJobs.map((job, index) => [
                index + 1,
                job.title,
                this.getCompanyId(job.company_name),
                this.getLocationId(job.normalized_location),
                this.getSalaryRangeId(job.normalized_salary),
                this.getExperienceLevelId(job.derived_experience_level),
                this.getJobCategoryId(job.job_category)
            ])
        );
    }

    static createCompaniesRelation(rawJobs) {
        let companyId = 1;
        
        rawJobs.forEach(job => {
            if (!this.companyMap.has(job.company_name)) {
                this.companyMap.set(job.company_name, companyId++);
            }
        });

        return new Relation(
            'companies',
            ['company_id', 'name'],
            Array.from(this.companyMap.entries()).map(([name, id]) => [id, name])
        );
    }

    static createLocationsRelation(rawJobs) {
        let locationId = 1;

        rawJobs.forEach(job => {
            if (!this.locationMap.has(job.normalized_location)) {
                this.locationMap.set(job.normalized_location, locationId++);
            }
        });

        return new Relation(
            'locations',
            ['location_id', 'location'],
            Array.from(this.locationMap.entries()).map(([location, id]) => [id, location])
        );
    }

    static createSkillsRelation(rawJobs) {
        const uniqueSkills = new Set();
        rawJobs.forEach(job => {
            job.skills_list.forEach(skill => uniqueSkills.add(skill));
        });

        let skillId = 1;
        uniqueSkills.forEach(skill => {
            this.skillMap.set(skill, skillId++);
        });

        return new Relation(
            'skills',
            ['skill_id', 'skill_name'],
            Array.from(this.skillMap.entries()).map(([skill, id]) => [id, skill])
        );
    }

    static createSalaryRangesRelation(rawJobs) {
        let rangeId = 1;

        rawJobs.forEach(job => {
            const key = `${job.normalized_salary.min}-${job.normalized_salary.max}`;
            if (!this.salaryRangeMap.has(key)) {
                this.salaryRangeMap.set(key, rangeId++);
            }
        });

        return new Relation(
            'salary_ranges',
            ['range_id', 'min_salary', 'max_salary'],
            Array.from(this.salaryRangeMap.entries()).map(([key, id]) => {
                const [min, max] = key.split('-').map(Number);
                return [id, min, max];
            })
        );
    }

    static createJobSkillsRelation(rawJobs) {
        const jobSkills = [];
        let relationId = 1;

        rawJobs.forEach((job, jobIndex) => {
            job.skills_list.forEach(skill => {
                const skillId = this.skillMap.get(skill);
                if (skillId) {
                    jobSkills.push([
                        relationId++,
                        jobIndex + 1,  // job_id
                        skillId
                    ]);
                }
            });
        });

        return new Relation(
            'job_skills',
            ['relation_id', 'job_id', 'skill_id'],
            jobSkills
        );
    }

    static createExperienceLevelsRelation(rawJobs) {
        const levels = new Set(rawJobs.map(job => job.derived_experience_level));
        let levelId = 1;

        levels.forEach(level => {
            this.experienceLevelMap.set(level, levelId++);
        });

        return new Relation(
            'experience_levels',
            ['level_id', 'level'],
            Array.from(this.experienceLevelMap.entries()).map(([level, id]) => [id, level])
        );
    }

    static createJobCategoriesRelation(rawJobs) {
        const categories = new Set(rawJobs.map(job => job.job_category));
        let categoryId = 1;

        categories.forEach(category => {
            this.jobCategoryMap.set(category, categoryId++);
        });

        return new Relation(
            'job_categories',
            ['category_id', 'name'],
            Array.from(this.jobCategoryMap.entries()).map(([category, id]) => [id, category])
        );
    }

    static createIndustriesRelation(rawJobs) {
        const industries = new Set(rawJobs.map(job => job.industry_category));
        let industryId = 1;

        industries.forEach(industry => {
            this.industryMap.set(industry, industryId++);
        });

        return new Relation(
            'industries',
            ['industry_id', 'name'],
            Array.from(this.industryMap.entries()).map(([industry, id]) => [id, industry])
        );
    }

    static createCompanyIndustriesRelation(rawJobs) {
        const relations = new Map();
        let relationId = 1;

        rawJobs.forEach(job => {
            const key = `${job.company_name}-${job.industry_category}`;
            if (!relations.has(key)) {
                relations.set(key, {
                    id: relationId++,
                    companyId: this.getCompanyId(job.company_name),
                    industryId: this.getIndustryId(job.industry_category)
                });
            }
        });

        return new Relation(
            'company_industries',
            ['relation_id', 'company_id', 'industry_id'],
            Array.from(relations.values()).map(relation => [
                relation.id,
                relation.companyId,
                relation.industryId
            ])
        );
    }

    // ID getter methods
    static getCompanyId(companyName) {
        return this.companyMap.get(companyName) || null;
    }

    static getLocationId(location) {
        return this.locationMap.get(location) || null;
    }

    static getSalaryRangeId(salaryRange) {
        const key = `${salaryRange.min}-${salaryRange.max}`;
        return this.salaryRangeMap.get(key) || null;
    }

    static getExperienceLevelId(level) {
        return this.experienceLevelMap.get(level) || null;
    }

    static getJobCategoryId(category) {
        return this.jobCategoryMap.get(category) || null;
    }

    static getIndustryId(industry) {
        return this.industryMap.get(industry) || null;
    }

    // Data processing helper methods
    static preprocessRow(row) {
        try {
            return {
                ...row,
                derived_experience_level: this.deriveExperienceLevel(
                    row.title || '', 
                    row.description || ''
                ),
                normalized_salary: this.normalizeSalary(row.salary_range),
                skills_list: this.extractSkills(row.description),
                normalized_location: this.normalizeLocation(row.location),
                industry_category: this.deriveIndustryCategory(
                    row.company_name || '', 
                    row.description || ''
                ),
                job_category: this.deriveJobCategory(
                    row.title || '', 
                    row.description || ''
                )
            };
        } catch (error) {
            console.error(`Error preprocessing row:`, error);
            return {
                ...row,
                derived_experience_level: 'unknown',
                normalized_salary: { min: null, max: null },
                skills_list: [],
                normalized_location: 'unknown',
                industry_category: 'unknown',
                job_category: 'unknown'
            };
        }
    }

    static deriveExperienceLevel(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        
        if (text.includes('senior') || text.includes('lead') || 
            text.includes('manager') || text.includes('director')) {
            return 'senior';
        } else if (text.includes('junior') || text.includes('entry') || 
                  text.includes('intern') || text.includes('trainee')) {
            return 'junior';
        }
        
        return 'mid';
    }

    static normalizeSalary(salaryRange) {
        if (!salaryRange) return { min: null, max: null };

        const salary = salaryRange.toString().toLowerCase();
        const cleaned = salary.replace(/[^0-9k\-]/g, '');
        
        let min = null;
        let max = null;

        if (cleaned.includes('-')) {
            const [minStr, maxStr] = cleaned.split('-');
            min = this.parseAmount(minStr);
            max = this.parseAmount(maxStr);
        } else {
            min = this.parseAmount(cleaned);
            max = min;
        }

        return { min, max };
    }

    static parseAmount(str) {
        if (!str) return null;
        
        str = str.replace(/[^0-9k]/g, '');
        
        let amount = 0;
        if (str.endsWith('k')) {
            amount = parseFloat(str.slice(0, -1)) * 1000;
        } else {
            amount = parseFloat(str);
        }
        
        return isNaN(amount) ? null : amount;
    }

    static extractSkills(description) {
        if (!description) return [];

        const commonSkills = [
            'python', 'java', 'javascript', 'sql', 'aws', 'docker',
            'kubernetes', 'react', 'node.js', 'machine learning',
            'data analysis', 'agile', 'scrum', 'git', 'ci/cd'
        ];
        
        try {
            const foundSkills = new Set();
            const desc = description.toString().toLowerCase();
            
            commonSkills.forEach(skill => {
                if (desc.includes(skill)) {
                    foundSkills.add(skill);
                }
            });
            
            return Array.from(foundSkills);
        } catch (error) {
            console.warn(`Error extracting skills: ${error.message}`);
            return [];
        }
    }

    static normalizeLocation(location) {
        if (!location) return 'Unknown';

        return location.toLowerCase()
            .trim()
            .replace(/^remote( -|:|\s+in)?/i, '')
            .replace(/^hybrid( -|:|\s+in)?/i, '')
            .split(/[,\-]/)[0]
            .trim() || 'Unknown';
    }


    static deriveIndustryCategory(companyName, description) {
        const text = `${companyName} ${description}`.toLowerCase();
        
        const categories = [
            { name: 'Technology', patterns: ['tech', 'software', 'it'] },
            { name: 'Finance', patterns: ['bank', 'finance', 'investment'] },
            { name: 'Healthcare', patterns: ['health', 'medical', 'pharma'] },
            { name: 'Education', patterns: ['education', 'university', 'school'] },
            { name: 'Retail', patterns: ['retail', 'ecommerce', 'shop'] }
        ];

        for (const category of categories) {
            if (category.patterns.some(pattern => text.includes(pattern))) {
                return category.name;
            }
        }
        
        return 'Other';
    }

    static deriveJobCategory(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        
        const categories = [
            { name: 'Engineering', patterns: ['engineer', 'developer', 'architect'] },
            { name: 'Data Science', patterns: ['data scientist', 'machine learning', 'ai'] },
            { name: 'Design', patterns: ['designer', 'ux', 'ui', 'graphic'] },
            { name: 'Marketing', patterns: ['marketing', 'seo', 'content'] },
            { name: 'Sales', patterns: ['sales', 'account manager', 'business'] }
        ];

        for (const category of categories) {
            if (category.patterns.some(pattern => text.includes(pattern))) {
                return category.name;
            }
        }
        
        return 'Other';
    }

    static calculateDatasetStatistics(relations) {
        return {
            totalJobs: relations.jobs.tuples.length,
            totalCompanies: relations.companies.tuples.length,
            totalSkills: relations.skills.tuples.length,
            averageSalaryRange: this.calculateAverageSalaryRange(relations.salaryRanges),
            skillDistribution: this.calculateSkillDistribution(relations.jobSkills, relations.skills),
            locationDistribution: this.calculateLocationDistribution(relations.locations),
            experienceLevelDistribution: this.calculateExperienceLevelDistribution(relations.experienceLevels)
        };
    }

    // Additional helper methods for statistics
    static calculateAverageSalaryRange(salaryRanges) {
        if (salaryRanges.tuples.length === 0) return { min: 0, max: 0 };
        
        let totalMin = 0;
        let totalMax = 0;
        let count = 0;
        
        salaryRanges.tuples.forEach(([_, min, max]) => {
            if (min !== null && max !== null) {
                totalMin += min;
                totalMax += max;
                count++;
            }
        });
        
        return count > 0 ? {
            min: totalMin / count,
            max: totalMax / count
        } : { min: 0, max: 0 };
    }

    static calculateSkillDistribution(jobSkills, skills) {
        const distribution = new Map();
        const skillMap = new Map(skills.tuples.map(([id, name]) => [id, name]));
        
        jobSkills.tuples.forEach(([_, __, skillId]) => {
            const skillName = skillMap.get(skillId);
            if (skillName) {
                distribution.set(
                    skillName,
                    (distribution.get(skillName) || 0) + 1
                );
            }
        });
        
        return Object.fromEntries(distribution);
    }

    static calculateLocationDistribution(locations) {
        return locations.tuples.reduce((acc, [id, location]) => {
            acc[location] = (acc[location] || 0) + 1;
            return acc;
        }, {});
    }

    static calculateExperienceLevelDistribution(experienceLevels) {
        return experienceLevels.tuples.reduce((acc, [id, level]) => {
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});
    }
}

module.exports = EnhancedJobLoader;