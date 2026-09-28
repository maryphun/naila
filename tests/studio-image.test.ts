import { describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { publicCatalogueSql, publicMerchant } from '../server/domain';

describe('studio image publication',()=>{
  it('keeps the service photo as fallback and publishes an uploaded studio photo separately',()=>{
    const db=new DatabaseSync(':memory:');
    for(const migration of ['0001_initial.sql','0002_merchant_work_types_and_shop_link.sql','0003_support_conversations.sql','0004_merchant_studio_image.sql'])db.exec(readFileSync(`database/migrations/${migration}`,'utf8'));
    db.exec(readFileSync('database/seed.sql','utf8'));
    const before=db.prepare(`${publicCatalogueSql} AND s.id=?`).get('french-gel') as {image:string;merchant_image:string};
    expect(before.image).toBe('/images/french.webp');
    expect(before.merchant_image).toBe('');

    const image='/api/media/11111111-1111-4111-8111-111111111111.webp';
    db.prepare('UPDATE merchants SET image=? WHERE id=?').run(image,'studio-mei');
    const merchant=db.prepare('SELECT * FROM merchants WHERE id=?').get('studio-mei') as Record<string,unknown>;
    const service=db.prepare(`${publicCatalogueSql} AND s.id=?`).get('french-gel') as {image:string;merchant_image:string};
    expect(publicMerchant(merchant).image).toBe(image);
    expect(service.merchant_image).toBe(image);
    expect(service.image).toBe('/images/french.webp');
    db.close();
  });
});
