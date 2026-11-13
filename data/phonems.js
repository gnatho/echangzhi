// Single source of truth: each entry holds its own metadata and word list.
// To add a new category, just append one object here — no second array to sync.
const PHONEME_DATA = [
    {
        key: "shortVowels",
        name: "Short Vowels",
        words: [
            "c[a]t", "b[e]d", "p[i]g", "h[o]t", "b[u]s",
            "m[a]p", "t[e]n", "s[i]t", "d[o]g", "c[u]p",
            "h[a]t", "p[e]n", "b[i]g", "l[o]g", "n[u]t",
            "r[a]n", "g[e]t", "f[i]x", "t[o]p", "c[u]t",
            "s[a]d", "l[e]t", "w[i]n", "h[o]p", "s[u]n",
            "j[a]m", "r[e]d", "d[i]d", "d[o]t", "m[u]d"
        ]
    },
    {
        key: "longA",
        name: "Long A",
        words: [
            "c[a]ke", "r[ai]n", "d[ay]", "[ei]ght", "w[ei]gh",
            "m[a]ke", "tr[ai]n", "pl[ay]", "v[ei]n", "sl[ei]gh",
            "n[a]me", "p[ai]n", "s[ay]", "th[ey]", "n[ei]ghbor",
            "f[a]ce", "w[ai]t", "p[ay]", "gr[ey]", "w[ei]ght",
            "l[a]ke", "s[ai]l", "st[ay]", "r[ei]gn", "fr[ei]ght",
            "t[a]pe", "ch[ai]n", "w[ay]", "ob[ey]", "[ei]ghty"
        ]
    },
    {
        key: "longE",
        name: "Long E",
        words: [
            "f[ee]t", "m[ea]t", "f[ie]ld", "c[ei]ling", "happ[y]", "k[ey]",
            "s[ee]", "s[ea]", "p[ie]ce", "rec[ei]ve", "bab[y]", "mon[ey]",
            "tr[ee]", "b[ea]d", "ch[ie]f", "br[ie]f", "ver[y]", "hon[ey]",
            "gr[ee]n", "l[ea]f", "th[ie]f", "dec[ei]ve", "funn[y]", "donk[ey]",
            "sl[ee]p", "t[ea]", "y[ie]ld", "s[ei]ze", "sorr[y]", "monk[ey]",
            "sw[ee]t", "s[ea]l", "sh[ie]ld", "rec[ei]pt", "onl[y]", "turk[ey]"
        ]
    },
    {
        key: "longI",
        name: "Long I",
        words: [
            "b[i]ke", "n[igh]t", "fl[y]", "p[ie]",
            "l[i]ke", "l[igh]t", "cr[y]", "t[ie]",
            "t[i]me", "h[igh]", "sk[y]", "d[ie]",
            "f[i]ve", "r[igh]t", "tr[y]", "l[ie]",
            "n[i]ne", "f[igh]t", "dr[y]", "d[ie]t",
            "r[i]de", "s[igh]t", "sh[y]", "tr[ie]d",
            "sm[i]le", "br[igh]t", "m[y]", "fr[y]", "h[i]", "sp[y]"
        ]
    },
    {
        key: "longO",
        name: "Long O",
        words: [
            "h[o]me", "b[oa]t", "sn[ow]", "t[oe]",
            "b[o]ne", "c[oa]t", "gr[ow]", "d[oe]",
            "r[o]se", "r[oa]d", "sh[ow]", "g[oe]s",
            "n[o]te", "g[oa]t", "sl[ow]", "f[oe]",
            "h[o]pe", "l[oa]d", "kn[ow]", "r[oe]",
            "st[o]ne", "fl[oa]t", "thr[ow]", "tipt[oe]",
            "c[o]de", "g[oa]l", "bl[ow]", "ob[oe]"
        ]
    },
    {
        key: "longU",
        name: "Long U",
        words: [
            "c[u]be", "f[ew]", "bl[ue]", "m[oo]n",
            "t[u]be", "n[ew]", "gl[ue]", "s[oo]n",
            "m[u]le", "ch[ew]", "tr[ue]", "sp[oo]n",
            "c[u]te", "kn[ew]", "cl[ue]", "b[oo]t",
            "r[u]le", "gr[ew]", "c[ue]", "f[oo]d",
            "d[u]de", "cr[ew]", "d[ue]", "t[oo]l",
            "h[u]ge", "fl[ew]", "d[ue]", "sch[oo]l"
        ]
    },
    {
        key: "rControlled",
        name: "R-Controlled",
        words: [
            "c[ar]", "h[er]", "b[ir]d", "c[or]n", "t[ur]n",
            "f[ar]", "t[er]m", "g[ir]l", "f[or]k", "b[ur]n",
            "st[ar]", "f[er]n", "st[ir]", "p[or]t", "s[ur]f",
            "p[ar]k", "v[er]b", "f[ir]st", "b[or]n", "h[ur]t",
            "d[ar]k", "ov[er]", "sh[ir]t", "sh[or]t", "c[ur]ve",
            "j[ar]", "p[er]k", "th[ir]d", "st[or]y", "n[ur]se"
        ]
    },
    {
        key: "diphthongs",
        name: "Vowel Teams & Diphthongs",
        words: [
            "h[ou]se", "c[ow]", "c[oi]n", "b[oy]", "[au]to", "s[aw]", "b[oo]k",
            "[ou]t", "n[ow]", "j[oi]n", "t[oy]", "h[au]l", "l[aw]", "l[oo]k",
            "l[ou]d", "t[ow]n", "p[oi]nt", "enj[oy]", "c[au]se", "dr[aw]", "g[oo]d",
            "s[ou]nd", "d[ow]n", "[oi]l", "j[oy]", "l[au]nch", "str[aw]", "f[oo]t",
            "r[ou]nd", "[ow]l", "s[oi]l", "s[oy]", "f[au]lt", "cr[aw]l", "w[oo]d",
            "m[ou]th", "h[ow]", "v[oi]ce", "r[oy]al", "s[au]ce", "l[aw]n", "t[oo]k"
        ]
    },
    {
        key: "digraphs",
        name: "Digraphs",
        words: [
            "[ch]in", "[sh]ip", "[th]at", "[th]in", "[wh]en", "[ph]one", "si[ng]",
            "[ch]at", "[sh]op", "[th]is", "ba[th]", "[wh]ere", "[ph]oto", "wi[ng]",
            "[ch]ip", "fi[sh]", "[th]em", "pa[th]", "[wh]ite", "gra[ph]", "so[ng]",
            "[ch]eck", "[sh]ell", "[th]en", "ma[th]", "[wh]eat", "dol[ph]in", "ki[ng]",
            "[ch]est", "[sh]eep", "[th]ose", "tee[th]", "[wh]ale", "ele[ph]ant", "ri[ng]",
            "[ch]air", "[sh]oe", "[th]ese", "clo[th]", "[wh]eel", "al[ph]abet", "bri[ng]"
        ]
    },
    {
        key: "beginBlends",
        name: "Begin Blends",
        words: [
            "[bl]ack", "[br]own", "[cl]ap", "[cr]y", "[dr]um", "[fl]ag", "[fr]og",
            "[gl]ad", "[gr]een", "[pl]an", "[pr]ay", "[sc]an", "[sk]in", "[sl]ip",
            "[sm]all", "[sn]ap", "[sp]in", "[st]op", "[sw]im", "[tr]ee", "[tw]in",
            "[bl]ue", "[br]ead", "[cl]ip", "[cr]ab", "[dr]op", "[fl]at", "[fr]ee",
            "[gl]ass", "[gr]ape", "[pl]ay", "[pr]ess", "[sc]arf", "[sk]y", "[sl]ow",
            "[sm]ile", "[sn]ow", "[sp]eak", "[st]ar", "[sw]eet", "[tr]ain", "[tw]elve"
        ]
    },
    {
        key: "endBlends",
        name: "End Blends",
        words: [
            "ha[nd]", "te[nt]", "fa[st]", "a[sk]", "wa[sp]", "le[ft]", "co[ld]",
            "mi[lk]", "he[lp]", "be[lt]", "ju[mp]", "ba[nk]", "she[lf]", "a[ct]",
            "sa[nd]", "mi[nt]", "li[st]", "ta[sk]", "gra[sp]", "so[ft]", "ho[ld]",
            "si[lk]", "gu[lp]", "sa[lt]", "la[mp]", "dri[nk]", "ne[xt]", "fa[ct]",
            "ba[nd]", "pri[nt]", "bu[st]", "ri[sk]", "ga[sp]", "gi[ft]", "fo[ld]",
            "be[nd]", "hu[nt]", "lo[st]", "de[sk]", "cri[sp]", "shi[ft]", "go[ld]"
        ]
    },
    {
        key: "arWords",
        name: "R as in are",
        words: [
            "c[ar]", "f[ar]", "b[ar]", "st[ar]", "j[ar]",
            "p[ar]k", "d[ar]k", "h[ar]d", "c[ar]d", "f[ar]m",
            "y[ar]d", "sh[ar]p", "c[ar]t", "p[ar]t", "b[ar]n",
            "m[ar]ch", "h[ar]p", "t[ar]t", "[ar]m", "sc[ar]",
            "ch[ar]t", "sm[ar]t", "sp[ar]k", "sh[ar]k", "g[ar]den",
            "p[ar]ty", "c[ar]go", "l[ar]ge", "st[ar]t", "m[ar]k"
        ]
    },
    {
        key: "orWords",
        name: "OR as in ore",
        words: [
            "f[or]", "n[or]", "b[or]n", "c[or]n", "h[or]n",
            "f[or]k", "p[or]k", "s[or]t", "sh[or]t", "p[or]t",
            "f[or]m", "st[or]m", "t[or]ch", "m[or]e", "sh[or]e",
            "sc[or]e", "sn[or]e", "st[or]e", "c[or]k", "f[or]ce",
            "n[or]th", "h[or]se", "st[or]k", "l[or]d", "f[or]t",
            "t[or]n", "w[or]n", "p[or]ch", "sp[or]t", "m[or]ning"
        ]
    },
    {
        key: "consonantG",
        name: "Consonant G",
        words: [
            "[g]et", "[g]ive", "[g]o", "[g]ood", "[g]ame",
            "[g]reen", "[g]irl", "[g]oat", "[g]um", "[g]ap",
            "do[g]", "le[g]", "ho[g]", "fo[g]", "jo[g]",
            "lo[g]", "ba[g]", "fla[g]", "dra[g]", "slu[g]",
            "bu[g]", "hu[g]", "mu[g]", "pu[g]", "ru[g]",
            "plu[g]", "[g]ross", "[g]reat", "[g]row", "[g]rass"
        ]
    },
    {
        key: "consonantH",
        name: "Consonant H",
        words: [
            "[h]at", "[h]en", "[h]it", "[h]ot", "[h]ug",
            "[h]am", "[h]op", "[h]ip", "[h]ad", "[h]im",
            "[h]e", "[h]er", "[h]ow", "[h]as", "[h]is",
            "[h]elp", "[h]and", "[h]ill", "[h]ome", "[h]ere",
            "[h]ide", "[h]igh", "[h]ead", "[h]old", "[h]ard",
            "[h]urt", "[h]ear", "[h]air", "[h]ole", "[h]unt"
        ]
    },
    {
        key: "blendST",
        name: "Blend ST",
        words: [
            "[st]ar", "[st]op", "[st]ep", "[st]ay", "[st]ir",
            "[st]and", "[st]em", "[st]amp", "[st]ill", "[st]one",
            "[st]ack", "[st]ick", "[st]iff", "[st]uck", "[st]ory",
            "[st]art", "[st]ore", "[st]orm", "[st]age", "[st]air",
            "[st]ool", "[st]ove", "[st]udy", "[st]eel", "[st]eam",
            "[st]uff", "[st]ock", "[st]ump", "[st]are", "[st]ate"
        ]
    }
];

// ---------------------------------------------------------------------------
// Selector population — now driven by the single PHONEME_DATA array
// ---------------------------------------------------------------------------

function populateWordSetSelector(selectorId) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;

    selector.innerHTML = '';
    PHONEME_DATA.forEach(({ key, name }) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = name;
        selector.appendChild(option);
    });
}

// ---------------------------------------------------------------------------
// Backward-compatibility helpers
// ---------------------------------------------------------------------------

/**
 * Returns a plain object keyed by `key`, each value being that entry's
 * `words` array — identical in shape to the old `phonemeSets` constant.
 *
 * Use this to migrate call-sites gradually:
 *   const phonemeSets = buildPhonemeSetMap();
 *   const words = phonemeSets["shortVowels"]; // still works
 */
function buildPhonemeSetMap() {
    return Object.fromEntries(
        PHONEME_DATA.map(({ key, words }) => [key, words])
    );
}

/**
 * Look up a single category's word list by key.
 *   const words = getWordsByKey("longA");
 */
function getWordsByKey(key) {
    return PHONEME_DATA.find(entry => entry.key === key)?.words ?? [];
}