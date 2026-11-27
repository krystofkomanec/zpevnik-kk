const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');

const offlineFile = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const englishSong = {
  id: '01234567-89ab-cdef-0123-456789abcde1',
  title: 'An English Song',
  artist: 'The Test Band',
  file: 'English.cho',
  lang: 'en',
  lyricsLanguage: 'en',
  revision: 2,
  cho: '{capo: 2}\n[B]One [Bb]two [D/F#]three [Am/E]four\n',
};
const czechSong = {
  id: '01234567-89ab-cdef-0123-456789abcde2',
  title: 'Příliš žluťoučký kůň',
  artist: 'Česká kapela',
  file: 'Czech.cho',
  lang: 'cz',
  lyricsLanguage: 'cs',
  cho: '[H]První [B]druhý [Hmi/F#]třetí\n',
};

function library(songs, version = 10000) {
  return {schema: 1, version, songs, catalog: []};
}

function upload(page, selector, data) {
  return page.locator(selector).setInputFiles({
    name: 'fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)),
  });
}

async function openOffline(page) {
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  await page.route(/^https?:/, route => route.abort());
  await page.goto(offlineFile);
  await expect(page.locator('#title')).not.toBeEmpty();
  return failures;
}

async function install(page, songs, version) {
  await upload(page, '#update-file', library(songs, version));
  await expect(page.locator('#update-status')).toContainText(/Aktualizováno|Updated/);
}

function chordLabels(page) {
  return page.locator('#score .ch');
}

test('search, language filtering, and Czech transposition of both roots and basses', async ({page}) => {
  const errors = await openOffline(page);
  const builtCount = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'version.json'), 'utf8')).count;
  await expect(page.locator('#list .item')).toHaveCount(builtCount);
  await install(page, [englishSong, czechSong]);
  await expect(chordLabels(page)).toHaveText(['H', 'B', 'D/F#', 'Am/E']);
  await page.locator('#song-settings-button').click();
  await page.locator('#up').click();
  await expect(chordLabels(page)).toHaveText(['C', 'H', 'D#/G', 'Bm/F']);
  await page.locator('#search').fill('zlutoucky');
  await expect(page.locator('#list .item')).toHaveCount(1);
  await page.locator('#list .item').click();
  await expect(chordLabels(page)).toHaveText(['H', 'B', 'Hmi/F#']);
  await page.locator('#song-settings-button').click();
  await page.locator('#up').click();
  await expect(chordLabels(page)).toHaveText(['C', 'H', 'Cmi/G']);
  await page.locator('#search').fill('test band');
  await expect(page.locator('#list .item')).toHaveCount(1);
  await page.locator('#search').clear();
  await page.locator('#language').click();
  await expect(page.locator('#list .item')).toHaveText(['An English SongThe Test Band']);
  await expect(chordLabels(page)).toHaveText(['C', 'H', 'D#/G', 'Bm/F']);
  await page.locator('#language').click();
  await expect(page.locator('#list .item')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('migrates legacy storage, imports old backups, exports IDs and reloads persisted settings', async ({page}) => {
  const errors = await openOffline(page);
  const {id, ...oldSong} = englishSong;
  await page.evaluate(({file}) => {
    localStorage.setItem('zpevnik.capo.' + file, '0');
    localStorage.setItem('zpevnik.pitch.' + file, '-2');
    localStorage.setItem('zpevnik.zoom.' + file, '28');
    localStorage.setItem('zpevnik.line-note.original', JSON.stringify({
      file, revision: 2, line: 2, created: '2026-01-01T00:00:00.000Z',
    }));
  }, oldSong);
  await install(page, [oldSong]);
  await expect(page.locator('#cap')).toBeEmpty();
  await expect(page.locator('#score')).toHaveCSS('font-size', '28px');
  const renamed = {...englishSong, file: 'Renamed.cho', legacyFiles: [oldSong.file]};
  await install(page, [renamed, czechSong], 10001);
  await expect(page.locator('#title')).toHaveText(renamed.title);
  await expect(page.locator('#score .reported')).toHaveCount(1);
  const savedReport = await page.evaluate(() => JSON.parse(localStorage.getItem('zpevnik.line-note.original')));
  expect(savedReport).toMatchObject({id, file: oldSong.file, line: 2, revision: 2});
  await expect(chordLabels(page)).toHaveText(['A', 'Ab', 'C/E', 'Gm/D']);
  await upload(page, '#settings-file', {
    format: 'kk-songbook-settings', version: 1, songs: { [oldSong.file]: {capo: 5, pitch: 3} },
  });
  await expect(page.locator('#cap')).toContainText('5');
  await expect(page.locator('#score')).toHaveCSS('font-size', '28px');
  await page.locator('#song-settings-button').click();
  await page.locator('#big').click();
  await page.locator('#up').click();
  await page.locator('#capo-fret').selectOption('4');
  await page.reload();
  await expect(page.locator('#cap')).toContainText('4');
  await expect(page.locator('#pitch')).toHaveText('+4');
  await expect(page.locator('#score')).toHaveCSS('font-size', '30px');

  await page.locator('#library-tools > summary').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-settings').click();
  const download = await downloadPromise;
  const backup = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  expect(backup).toEqual({
    format: 'kk-songbook-settings', version: 2, songs: { ['id:' + id]: {capo: 4, pitch: 4, zoom: 30} },
  });
  await upload(page, '#settings-file', {...backup, songs: {['id:' + id]: {pitch: 0, zoom: 20}}});
  await expect(page.locator('#pitch')).toHaveText('0');
  await expect(page.locator('#score')).toHaveCSS('font-size', '20px');
  await page.locator('#list .item').filter({hasText: czechSong.title}).click();
  await expect(page.locator('#pitch')).toHaveText('0');
  await expect(page.locator('#cap')).toBeEmpty();
  await page.locator('#list .item').filter({hasText: renamed.title}).click();
  await expect(page.locator('#cap')).toContainText('4');
  expect(errors).toEqual([]);
});

test('checks and installs newer libraries, keeps offline cache, and honors both language modes', async ({page}) => {
  const errors = await openOffline(page);
  const privateBuild = await page.evaluate(() => window.privateRepository);
  const endpoint = privateBuild ? 'https://api.github.com/repos/**' : 'https://raw.githubusercontent.com/**';
  await page.route(endpoint, async route => {
    const checking = route.request().url().includes('version.json');
    await route.fulfill({json: checking ? {version: 10000} : library([englishSong, czechSong])});
  });
  await page.locator('#library-tools > summary').click();
  await page.locator('#check-library').click();
  if (privateBuild) {
    await page.locator('#library-token').fill('offline-test-fixture');
    await page.locator('#private-update').click();
  }
  await expect(page.locator('#update-library')).toBeVisible();
  await page.locator('#update-library').click();
  await expect(page.locator('#list .item')).toHaveCount(2);
  await page.unroute(endpoint);
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.locator('#list .item')).toHaveCount(2);
  await page.locator('#language').click();
  await install(page, [czechSong], 10001);
  await expect(page.locator('#list .item')).toHaveCount(0);
  await expect(page.locator('#title')).toBeEmpty();
  await page.locator('#language').click();
  await expect(page.locator('#title')).toHaveText(czechSong.title);
  await upload(page, '#update-file', library([englishSong]));
  await expect(page.locator('#update-status')).toContainText('nejnovější');
  await expect(page.locator('#title')).toHaveText(czechSong.title);
  expect(errors).toEqual([]);
});

test('guitar alternatives use playable shapes and keep harmonic suggestions separate', async ({page}) => {
  const screenshotDir = process.env.SONGBOOK_SCREENSHOTS;
  const errors = await openOffline(page);
  await install(page, [{...englishSong, cho: '[C]One [Dm]two [F]three [G]four [Am]five [Em]six\n'}]);
  await page.locator('#guitar > summary').click();
  const group = page.locator('.chart-group').first();
  const defaultShape = group.locator(':scope > .chart');
  await expect(defaultShape.locator('small')).toHaveText('× 3 2 0 1 0');
  await group.locator('summary').first().click();
  const voicings = group.locator('.chart-choice').first().locator('.chart');
  await expect(voicings.locator('svg')).toHaveCount(4);
  const shapes = await voicings.locator('small').allTextContents();
  expect(new Set(shapes).size).toBe(shapes.length);
  expect(shapes).not.toContain('× 3 2 0 1 0');
  for (const shape of shapes) {
    const frets = shape.split(' ');
    const notes = frets.flatMap((fret, index) => fret === '×' ? [] : [([40,45,50,55,59,64][index] + Number(fret)) % 12]);
    expect([...new Set(notes)].sort((a,b) => a-b)).toEqual([0,4,7]);
  }
  await group.locator('summary').last().click();
  const variations = group.locator('.chart-choice').last().locator('.chart');
  await expect(variations.locator('b')).toHaveText(['Cadd9', 'Cmaj7', 'C/G']);
  await expect(variations.locator('svg')).toHaveCount(3);
  const subdominant = page.locator('.chart-group').nth(2).locator('.chart-choice').last();
  await subdominant.locator('summary').click();
  await expect(subdominant.locator('.chart b')).toHaveText(['Fsus2', 'Fmaj7', 'F6']);
  const dominant = page.locator('.chart-group').nth(3).locator('.chart-choice').last();
  await dominant.locator('summary').click();
  await expect(dominant.locator('.chart b').first()).toHaveText('Gsus4');
  await expect(chordLabels(page)).toHaveText(['C','Dm','F','G','Am','Em']);
  if (screenshotDir) await page.screenshot({path: path.join(screenshotDir, 'guitar-voicings.png'), fullPage: true});
  await page.locator('#song-settings-button').click();
  await page.locator('#down').click();
  await expect(page.locator('#charts .chart-group').first().locator(':scope > .chart b')).toHaveText('H');
  expect(errors).toEqual([]);
});

const instrumental = '[G] [H] [B] [D]';
const longLyric = '[C]Never stop until [G]the morning light '.repeat(8);
const longScore = [
  '{comment: Verse 1}', ...Array.from({length: 4}, () => longLyric),
  '{comment: Interlude}', instrumental, '{start_of_tab}',
  ...Array.from({length: 65}, (_, i) => 'E|----0----2----3----0----2----3---|' + i),
  '{end_of_tab}', '{comment: Verse 2}',
  '[Am]We can stay together [F]through the night '.repeat(6), ...Array.from({length: 8}, () => longLyric),
].join('\n');

async function visibleScore(page) {
  return page.locator('#score').evaluate(score => {
    const viewport = score.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(score.parentElement, '::after').height) || 0;
    const top = viewport.top + (parseFloat(getComputedStyle(score.parentElement, '::before').height) || 0);
    const bottom = viewport.top + score.clientHeight - gap;
    const visible = [], clipped = [], misaligned = [];
    const chords = [...score.querySelectorAll('.ch')];
    chords.forEach((chord, i) => {
      const box = chord.getBoundingClientRect(), chunk = chord.closest('.chunk');
      const pair = chunk.getBoundingClientRect();
      const text = [...chunk.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
      const range = document.createRange();
      range.selectNode(text);
      const lyric = range.getBoundingClientRect();
      if (Math.abs(box.left - lyric.left) > 1 || box.bottom > lyric.bottom) misaligned.push(i);
      if (box.bottom <= top + 0.75 || box.top >= bottom - 0.75) return;
      if (pair.bottom > bottom + 0.75 || pair.top < top - 0.75) clipped.push({i, position: score.scrollTop, top, bottom, gap, pair: pair.toJSON(), box: box.toJSON(), line: chunk.closest('.line').getBoundingClientRect().toJSON()});
      else visible.push(i);
    });
    const headings = [...score.querySelectorAll('.section')].map(heading => ({
      heading: heading.getBoundingClientRect().toJSON(),
      next: heading.nextElementSibling?.getBoundingClientRect().toJSON(),
    }));
    const orphanHeading = headings.some(({heading, next}) =>
      next && heading.top >= top - 0.75 && heading.bottom <= bottom + 0.75 && next.top >= bottom - 0.75);
    return {visible, clipped, misaligned, orphanHeading, count: chords.length, position: score.scrollTop,
      horizontalOverflow: Math.max(score.scrollWidth - score.clientWidth, document.documentElement.scrollWidth - innerWidth)};
  });
}

async function inspectPages(page, advance) {
  const seen = new Set();
  let previous = -1;
  for (let i = 0; i < 160; i++) {
    const view = await visibleScore(page);
    expect(view.clipped).toEqual([]);
    expect(view.misaligned).toEqual([]);
    expect(view.orphanHeading).toBe(false);
    expect(view.horizontalOverflow).toBeLessThanOrEqual(1);
    expect(view.position).toBeGreaterThan(previous);
    view.visible.forEach(index => seen.add(index));
    if (await page.locator('#next-page').isDisabled()) {
      expect(seen.size).toBe(view.count);
      return;
    }
    previous = view.position;
    await advance();
  }
  throw Error('Failed to reach last page');
}

for (const [device, width, height] of [['mobile',360,640], ['tablet',768,1024], ['desktop',1440,900]]) {
  test.describe(device, () => {
    test.use({viewport: {width, height}, hasTouch: device !== 'desktop'});

    test('play mode keeps wrapped chords and lyrics together and supports navigation', async ({page}) => {
      const errors = await openOffline(page);
      await install(page, [{...englishSong, cho: longScore}]);
      expect(await chordLabels(page).allTextContents()).toContain('H');
      await page.locator('#play').click();
      await expect(page.locator('#exit-play')).toBeFocused();
      await expect(page.locator('#next-page')).toBeEnabled();
      const screenshotDir = process.env.SONGBOOK_SCREENSHOTS;
      if (screenshotDir) await page.screenshot({path: path.join(screenshotDir, 'play-' + device + '.png')});
      await inspectPages(page, device === 'desktop' ?
        () => page.keyboard.press('PageDown') : () => page.locator('#next-page').tap());
      await expect(page.locator('#prev-page')).toBeEnabled();
      const last = (await visibleScore(page)).position;
      await page.keyboard.press('ArrowUp');
      expect((await visibleScore(page)).position).toBeLessThan(last);
      await page.keyboard.press('Escape');
      await expect(page.locator('#score-frame')).toHaveCSS('display', 'contents');
      expect(errors).toEqual([]);
    });
  });
}

test('repaginates after a touch zoom, rotation, and expansion of oversized tablature', async ({page}) => {
  await page.setViewportSize({width: 390, height: 650});
  await openOffline(page);
  await install(page, [{...englishSong, cho: longScore}]);
  await page.locator('#play').click();
  await page.locator('#score').evaluate(score => {
    function send(type, distance, active = true) {
      const touches = [0, distance].map((clientX, identifier) => new Touch({target: score, clientX, clientY: 100, identifier}));
      score.dispatchEvent(new TouchEvent(type, {touches: active ? touches : [], bubbles: true, cancelable: true}));
    }
    send('touchstart', 50);
    send('touchmove', 85);
    send('touchend', 85, false);
  });
  await expect(page.locator('#score')).toHaveCSS('font-size', '36px');
  await page.setViewportSize({width: 650, height: 390});
  await expect(page.locator('#next-page')).toBeEnabled();
  await inspectPages(page, () => page.keyboard.press('ArrowDown'));

  await page.keyboard.press('Escape');
  await page.locator('#play').click();
  await page.locator('#score details > summary').evaluate(summary => summary.click());
  const area = page.locator('#score');
  const tab = area.locator('pre');
  await expect(tab).toBeVisible();
  const bottomReached = [];
  for (let i = 0; i < 160; i++) {
    const reached = await tab.evaluate(pre => {
      const area = pre.closest('#score'), end = pre.getBoundingClientRect().bottom;
      return end > area.getBoundingClientRect().top && end < area.getBoundingClientRect().bottom;
    });
    bottomReached.push(reached);
    if (await page.locator('#next-page').isDisabled()) break;
    await page.keyboard.press('PageDown');
  }
  expect(bottomReached).toContain(true);
  await expect(page.locator('#next-page')).toBeDisabled();
});
