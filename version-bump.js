/**
 * Version Bump Utility
 * ---------------------
 * Usage:
 *   node version-bump.js <component-id> <patch|minor|major>
 *   node version-bump.js --auto          (detect changed files via git, auto-bump patch)
 *   node version-bump.js --list          (list all components and versions)
 *
 * On bump, updates both version-registry.json (source of truth) and
 * version-display.js (embedded runtime registry).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const REGISTRY_PATH = path.join(ROOT, 'version-registry.json');
const DISPLAY_PATH = path.join(ROOT, 'version-display.js');

function loadRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(raw);
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf8');
}

function generateDisplayFile(registry) {
  const entries = Object.entries(registry).map(function([id, comp]) {
    return '    "' + id + '":{"n":"' + comp.name + '","v":"' + comp.version + '","d":"' + comp.date + '"}';
  }).join(',\n');

  const content = '(function(){\n' +
    '  var registry = {\n' +
    entries + '\n' +
    '  };\n' +
    '\n' +
    '  function init() {\n' +
    '    var componentId = document.documentElement.getAttribute(\'data-component\');\n' +
    '    if (!componentId) return;\n' +
    '    var entry = registry[componentId];\n' +
    '    if (!entry) return;\n' +
    '\n' +
    '    var style = document.createElement(\'style\');\n' +
    '    style.textContent = \'#kv-badge{position:fixed;bottom:6px;right:8px;z-index:2147483647;pointer-events:none;font-family:"SF Mono",Consolas,Monaco,monospace;font-size:9px;line-height:1.3;color:rgba(255,255,255,0.38);background:rgba(0,0,0,0.22);padding:3px 7px;border-radius:4px;letter-spacing:0.02em;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);transition:opacity 0.4s;opacity:0.5}#kv-badge:hover{opacity:0.95}\';\n' +
    '    document.head.appendChild(style);\n' +
    '\n' +
    '    var badge = document.createElement(\'div\');\n' +
    '    badge.id = \'kv-badge\';\n' +
    '    badge.textContent = entry.n + \'  v\' + entry.v + \' (\' + entry.d + \')\';\n' +
    '    document.body.appendChild(badge);\n' +
    '  }\n' +
    '\n' +
    '  if (document.readyState === \'loading\') {\n' +
    '    document.addEventListener(\'DOMContentLoaded\', init);\n' +
    '  } else {\n' +
    '    init();\n' +
    '  }\n' +
    '})();\n';

  fs.writeFileSync(DISPLAY_PATH, content, 'utf8');
}

function bumpSemver(version, bumpType) {
  var parts = version.split('.').map(Number);
  if (bumpType === 'major') {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (bumpType === 'minor') {
    parts[1]++;
    parts[2] = 0;
  } else {
    parts[2]++;
  }
  return parts.join('.');
}

function todayStr() {
  var d = new Date();
  var yyyy = d.getFullYear();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function bumpComponent(registry, componentId, bumpType) {
  if (!registry[componentId]) {
    console.error('ERROR: Unknown component "' + componentId + '". Use --list to see available components.');
    process.exit(1);
  }
  var oldVer = registry[componentId].version;
  var newVer = bumpSemver(oldVer, bumpType);
  registry[componentId].version = newVer;
  registry[componentId].date = todayStr();
  console.log('Bumped ' + componentId + ' (' + registry[componentId].name + '): ' + oldVer + ' -> ' + newVer + ' (' + registry[componentId].date + ')');
  return registry;
}

function autoBump(registry) {
  var changed = new Set();
  try {
    var diffOut = execSync('git diff --name-only HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
    var stagedOut = execSync('git diff --cached --name-only', { cwd: ROOT, encoding: 'utf8' }).trim();
    var untrackedOut = execSync('git ls-files --others --exclude-standard', { cwd: ROOT, encoding: 'utf8' }).trim();

    [diffOut, stagedOut, untrackedOut].forEach(function(out) {
      if (out) {
        out.split('\n').forEach(function(f) { changed.add(f.trim()); });
      }
    });
  } catch (e) {
    console.error('ERROR: Failed to get git diff. Ensure you are in a git repository.');
    process.exit(1);
  }

  if (changed.size === 0) {
    console.log('No file changes detected.');
    return registry;
  }

  var affectedComponents = new Set();
  changed.forEach(function(file) {
    Object.entries(registry).forEach(function(_a) {
      var compId = _a[0];
      var comp = _a[1];
      var files = comp.files || [compId];
      files.forEach(function(pattern) {
        var normalized = file.replace(/\\/g, '/');
        var patNorm = pattern.replace(/\\/g, '/');
        if (normalized === patNorm || normalized.startsWith(patNorm) || patNorm.startsWith(normalized)) {
          affectedComponents.add(compId);
        }
      });
    });
  });

  if (affectedComponents.size === 0) {
    console.log('Changed files do not match any component. No bumps applied.');
    console.log('Changed files: ' + Array.from(changed).join(', '));
    return registry;
  }

  console.log('Changed files: ' + Array.from(changed).join(', '));
  console.log('Affected components: ' + Array.from(affectedComponents).join(', '));

  affectedComponents.forEach(function(compId) {
    registry = bumpComponent(registry, compId, 'patch');
  });

  return registry;
}

function listComponents(registry) {
  console.log('\nComponent Registry:');
  console.log('───────────────────');
  Object.entries(registry).forEach(function(_a) {
    var id = _a[0];
    var comp = _a[1];
    console.log('  ' + id.padEnd(24) + 'v' + comp.version.padEnd(10) + comp.date + '  ' + comp.name);
  });
  console.log('');
}

var args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('Version Bump Utility');
  console.log('────────────────────');
  console.log('  node version-bump.js <component-id> <patch|minor|major>');
  console.log('  node version-bump.js --auto');
  console.log('  node version-bump.js --list');
  process.exit(0);
}

var registry = loadRegistry();

if (args[0] === '--list') {
  listComponents(registry);
  process.exit(0);
}

if (args[0] === '--auto') {
  registry = JSON.parse(JSON.stringify(registry));
  registry = autoBump(registry);
  saveRegistry(registry);
  generateDisplayFile(registry);
  console.log('Registry and display file updated.');
  process.exit(0);
}

if (args.length >= 2) {
  var compId = args[0];
  var bumpType = args[1];
  if (['patch', 'minor', 'major'].indexOf(bumpType) === -1) {
    console.error('ERROR: bump type must be "patch", "minor", or "major".');
    process.exit(1);
  }
  registry = bumpComponent(registry, compId, bumpType);
  saveRegistry(registry);
  generateDisplayFile(registry);
  console.log('Registry and display file updated.');
  process.exit(0);
}

console.error('ERROR: invalid arguments. Use --help for usage.');
process.exit(1);
