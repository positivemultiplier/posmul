
import Parser from 'rss-parser';

const parser = new Parser({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
});

async function run() {
    try {
        console.log('Fetching RSS...');
        const feed = await parser.parseURL('https://www.korea.kr/rss/policy.xml');
        console.log(`Title: ${feed.title}`);
        console.log(`Items: ${feed.items.length}`);
        if (feed.items.length > 0) {
            console.log('First item:', feed.items[0]);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
