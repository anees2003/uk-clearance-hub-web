import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIRMNESS_SCALE_LEVELS,
  SLEEP_POSITIONS_GUIDE,
  MATTRESS_TYPES_COMPARISON,
  UK_BED_SIZE_DETAILS,
  FAQ_ITEMS,
  FAQ_CATEGORIES,
  computeMattressSquashScaleY,
  getFirmnessLevelInfo,
  recommendBedSizeForRoom,
  filterFaqItems,
  findFaqByHash,
  validateContactForm,
} from './informativePages';

test('computeMattressSquashScaleY and getFirmnessLevelInfo cover ratings 1..10 monotonically', () => {
  assert.equal(FIRMNESS_SCALE_LEVELS.length, 10);
  const softScale = computeMattressSquashScaleY(1);
  const mediumScale = computeMattressSquashScaleY(5);
  const firmScale = computeMattressSquashScaleY(10);
  assert.ok(softScale < mediumScale);
  assert.ok(mediumScale < firmScale);
  assert.equal(getFirmnessLevelInfo(1).rating, 1);
  assert.equal(getFirmnessLevelInfo(10).rating, 10);
});

test('SLEEP_POSITIONS_GUIDE and MATTRESS_TYPES_COMPARISON contain required UK entries', () => {
  assert.equal(SLEEP_POSITIONS_GUIDE.length, 3);
  assert.equal(MATTRESS_TYPES_COMPARISON.length, 5);
  assert.ok(
    MATTRESS_TYPES_COMPARISON.every((m) => m.clearancePriceRange.includes('£'))
  );
});

test('recommendBedSizeForRoom enforces at least 60 cm clearance on each side and foot end', () => {
  assert.equal(UK_BED_SIZE_DETAILS.length, 5);

  // Large master bedroom (3.4m x 3.4m) -> Super King (180x200) leaves 80cm each side, 140cm foot
  const largeRoom = recommendBedSizeForRoom(3.4, 3.4);
  assert.equal(largeRoom.recommendedSize.name, 'Super King');
  assert.equal(largeRoom.fitsWithFullClearance, true);
  assert.ok(largeRoom.sideClearanceCmEach >= 60);
  assert.ok(largeRoom.footClearanceCm >= 60);

  // Standard UK master bedroom (2.8m x 2.8m) -> King (150x200) leaves 65cm each side, 80cm foot
  // (Super King 180cm would leave only 50cm each side < 60cm)
  const mediumRoom = recommendBedSizeForRoom(2.8, 2.8);
  assert.equal(mediumRoom.recommendedSize.name, 'King');
  assert.equal(mediumRoom.sideClearanceCmEach, 65);
  assert.equal(mediumRoom.footClearanceCm, 80);

  // Compact double bedroom (2.6m x 2.55m) -> Double (135x190) fits (62.5cm each side, 65cm foot), King (200cm length) would leave 55cm foot < 60cm
  const compactDouble = recommendBedSizeForRoom(2.6, 2.55);
  assert.equal(compactDouble.recommendedSize.name, 'Double');

  // Very narrow box room (1.9m x 2.3m) -> falls back to Single with fitsWithFullClearance = false
  const boxRoom = recommendBedSizeForRoom(1.9, 2.3);
  assert.equal(boxRoom.recommendedSize.name, 'Single');
  assert.equal(boxRoom.fitsWithFullClearance, false);
});

test('FAQ_ITEMS, filterFaqItems, and findFaqByHash support category tabs, live search, and #delivery-time deep link', () => {
  assert.ok(FAQ_ITEMS.length >= 10);
  assert.deepEqual(FAQ_CATEGORIES, [
    'All',
    'Ordering',
    'Delivery',
    'Returns',
    'Product condition',
    'Payments',
  ]);

  const deliveryTimeItem = findFaqByHash(FAQ_ITEMS, '#delivery-time');
  assert.ok(deliveryTimeItem);
  assert.equal(deliveryTimeItem?.id, 'delivery-time');
  assert.equal(deliveryTimeItem?.category, 'Delivery');

  const deliveryFiltered = filterFaqItems(FAQ_ITEMS, 'Delivery', '');
  assert.ok(deliveryFiltered.length >= 2);
  assert.ok(deliveryFiltered.every((item) => item.category === 'Delivery'));

  const searchFiltered = filterFaqItems(FAQ_ITEMS, 'All', 'Consumer Rights');
  assert.ok(searchFiltered.length >= 1);
});

test('validateContactForm validates Name, Email, UK Phone, Topic, and Message', () => {
  const invalid = validateContactForm({
    name: '',
    email: 'invalid-email',
    phone: '123',
    topic: '',
    message: 'short',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.phone);
  assert.ok(invalid.errors.topic);
  assert.ok(invalid.errors.message);

  const valid = validateContactForm({
    name: 'Arthur Pendelton',
    email: 'arthur@example.co.uk',
    phone: '07700 900456',
    topic: 'Clearance stock enquiry',
    message: 'I would like to check availability for the Savoy Ottoman Bed.',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});
