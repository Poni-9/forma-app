import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DRAFT_PREFIX, DRAFT_TTL, readMealDraft, writeMealDraft} from '../assets/meal-draft-37621.js';
const storage = () => {
  const items = new Map();
  return {getItem:key=>items.get(key)??null, setItem:(key,value)=>items.set(key,value), removeItem:key=>items.delete(key)};
};
test('drafts are scoped by account and day, including guest mode', () => {
  const s=storage();
  writeMealDraft('guest:2026-11-04','200 g jogurta',s,1000);
  writeMealDraft('user-a:2026-11-04','100 g riža',s,1000);
  writeMealDraft('guest:2026-11-03','včerajšnji obrok',s,1000);
  assert.equal(readMealDraft('guest:2026-11-04',s,1001),'200 g jogurta');
  assert.equal(readMealDraft('user-a:2026-11-04',s,1001),'100 g riža');
  assert.equal(readMealDraft('user-b:2026-11-04',s,1001),'');
  writeMealDraft('guest:2026-11-04','',s,1001);
  assert.equal(readMealDraft('guest:2026-11-04',s,1001),'');
  assert.equal(readMealDraft('guest:2026-11-03',s,1001),'včerajšnji obrok');
});
test('stale or malformed drafts never repopulate the input', () => {
  const s=storage();
  writeMealDraft('a','meal',s,1000);
  assert.equal(readMealDraft('a',s,1000+DRAFT_TTL-1),'meal');
  assert.equal(readMealDraft('a',s,1000+DRAFT_TTL),'');
  for(const value of ['{bad json}',JSON.stringify({text:42,at:1}),JSON.stringify({text:'meal',at:'bad'}),JSON.stringify({text:'meal',at:999999999})]) {
    s.setItem(DRAFT_PREFIX+'a',value);assert.equal(readMealDraft('a',s,1000),'');
  }
});
test('disabled or full storage cannot break the meal editor', () => {
  const s={getItem(){throw Error('denied')},setItem(){throw Error('quota')},removeItem(){throw Error('denied')}};
  assert.equal(readMealDraft('a',s),'');
  assert.doesNotThrow(()=>writeMealDraft('a','meal',s));
  assert.doesNotThrow(()=>writeMealDraft('a','',s));
});
