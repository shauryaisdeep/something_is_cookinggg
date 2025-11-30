#!/usr/bin/env node

/**
 * Quick Test for Trading Pairs
 * Tests just a few pairs to verify the system is working
 */

const axios = require('axios');

async function quickTest() {
    console.log('🚀 Quick Test - Checking System Status');
    
    try {
        const response = await axios.get('http://localhost:5000/api/top-assets/dex-data', {
            timeout: 10000
        });
        
        const data = response.data;
        if (data.success) {
            console.log('✅ System is working!');
            console.log(`📊 Total pairs analyzed: ${data.data.marketStats.totalPairs}`);
            console.log(`💧 Liquid pairs: ${data.data.marketStats.liquidPairs}`);
            console.log(`❌ Error pairs: ${data.data.marketStats.errorPairs}`);
            console.log(`📈 Top assets: ${data.data.topAssets.length}`);
            
            if (data.data.marketStats.liquidPairs >= 20) {
                console.log('🎉 SUCCESS: Found 20+ liquid pairs!');
            } else {
                console.log(`⚠️  Found ${data.data.marketStats.liquidPairs} liquid pairs (need 20+)`);
            }
        } else {
            console.log('❌ API returned error');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

quickTest();
