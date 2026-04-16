const phonemeSetInfo = [
    { key: "shortVowels", name: "Short Vowels" },
    { key: "longA", name: "Long A" },
    { key: "longE", name: "Long E" },
    { key: "longI", name: "Long I" },
    { key: "longO", name: "Long O" },
    { key: "longU", name: "Long U" },
    { key: "rControlled", name: "R-Controlled" },
    { key: "diphthongs", name: "Diphthongs" },
    { key: "digraphs", name: "Digraphs" },
    { key: "beginBlends", name: "Begin Blends" },
    { key: "endBlends", name: "End Blends" },
    { key: "arWords", name: "R as in are" },
    { key: "orWords", name: "OR as in ore" },
    { key: "consonantG", name: "Consonant G" }
];

const phonemeSets = {
    shortVowels: [
        "c[a]t", "b[e]d", "p[i]g", "h[o]t", "b[u]s",
        "m[a]p", "t[e]n", "s[i]t", "d[o]g", "c[u]p",
        "h[a]t", "p[e]n", "b[i]g", "l[o]g", "n[u]t",
        "r[a]n", "g[e]t", "f[i]x", "t[o]p", "c[u]t",
        "s[a]d", "l[e]t", "w[i]n", "h[o]p", "s[u]n",
        "j[a]m", "r[e]d", "d[i]d", "d[o]t", "m[u]d"
    ],
    longA: [
        "c[a]ke", "r[ai]n", "d[ay]", "[ei]ght", "w[ei]gh",
        "m[a]ke", "tr[ai]n", "pl[ay]", "v[ei]n", "sl[ei]gh",
        "n[a]me", "p[ai]n", "s[ay]", "th[ey]", "n[ei]gh",
        "f[a]ce", "w[ai]t", "p[ay]", "gr[ey]", "h[ei]ght",
        "l[a]ke", "s[ai]l", "st[ay]", "r[ei]gn", "w[ei]rd",
        "t[a]pe", "ch[ai]n", "w[ay]", "ob[ey]", "f[ei]nt"
    ],
    longE: [
        "f[ee]t", "m[ea]t", "f[ie]ld", "c[ei]ling", "happ[y]", "k[ey]",
        "s[see]", "s[sea]", "p[pie]ce", "rec[ei]ve", "bab[y]", "mon[ey]",
        "tr[ee]", "b[ea]d", "ch[ie]f", "br[ie]f", "ver[y]", "hon[ey]",
        "gr[ee]n", "l[ea]f", "sh[ie]ld", "dec[ei]t", "funn[y]", "donk[ey]",
        "sl[ee]p", "t[ea]", "y[ie]ld", "c[ei]se", "sorr[y]", "j[ey]",
        "sw[ee]t", "s[ea]l", "th[ie]f", "rel[ei]f", "earl[y]", "vall[ey]"
    ],
    longI: [
        "b[i]ke", "n[igh]t", "fl[y]", "p[ie]",
        "l[i]ke", "l[igh]t", "cr[y]", "t[ie]",
        "t[i]me", "h[igh]", "sk[y]", "d[ie]",
        "f[i]ve", "r[igh]t", "tr[y]", "l[ie]",
        "n[i]ne", "f[igh]t", "dr[y]", "p[ie]",
        "r[i]de", "s[igh]t", "fl[y]", "t[ie]",
        "sm[i]le", "br[igh]t", "m[y]", "cr[y]"
    ],
    longO: [
        "h[o]me", "b[oa]t", "sn[ow]", "t[oe]",
        "b[o]ne", "c[oa]t", "gr[ow]", "h[oe]",
        "r[o]se", "r[oa]d", "sh[ow]", "w[oe]",
        "n[o]te", "g[oa]t", "sl[ow]", "f[oe]",
        "h[o]pe", "l[oa]d", "kn[ow]", "t[oe]",
        "st[o]ne", "fl[oa]t", "thr[ow]", "can[oe]",
        "c[o]de", "g[oa]l", "bl[ow]", "t[oe]"
    ],
    longU: [
        "c[u]be", "f[ew]", "bl[ue]", "m[oo]n",
        "t[u]be", "n[ew]", "gl[ue]", "s[oo]n",
        "m[u]le", "d[ew]", "tr[ue]", "sp[oo]n",
        "c[u]te", "kn[ew]", "cl[ue]", "b[oo]t",
        "r[u]le", "gr[ew]", "q[ue]ue", "f[oo]d",
        "d[u]de", "v[iew]", "arg[ue]", "t[oo]l",
        "f[u]me", "f[ew]", "iss[ue]", "sch[oo]l"
    ],
    rControlled: [
        "c[ar]", "h[er]", "b[ir]d", "c[or]n", "t[ur]n",
        "f[ar]", "t[er]m", "g[ir]l", "f[or]k", "b[ur]n",
        "st[ar]", "f[er]n", "st[ir]", "p[or]t", "s[ur]f",
        "p[ar]k", "v[er]b", "f[ir]st", "b[or]n", "h[ur]t",
        "d[ar]k", "ov[er]", "sh[ir]t", "sh[or]t", "c[ur]ve",
        "j[ar]", "p[er]k", "th[ir]d", "st[or]y", "n[ur]se"
    ],
    diphthongs: [
        "h[ou]se", "c[ow]", "c[oi]n", "b[oy]", "[au]to", "s[aw]", "b[oo]k",
        "[ou]t", "n[ow]", "j[oi]n", "t[oy]", "[au]gust", "l[aw]", "l[oo]k",
        "l[ou]d", "t[own]", "p[oi]nt", "en[joy]", "c[au]se", "dr[aw]", "g[oo]d",
        "s[ou]nd", "d[own]", "[oi]l", "destr[oy]", "l[au]nch", "str[aw]", "st[oo]l",
        "r[ou]nd", "br[ow]", "s[oi]l", "empl[oy]", "f[au]lt", "cr[aw]l", "t[oo]k",
        "m[ou]th", "h[ow]", "v[oi]ce", "ann[oy]", "s[au]ce", "l[aw]n", "b[oo]t"
    ],
    digraphs: [
        "[ch]in", "[sh]ip", "[th]at", "[th]in", "[wh]en", "[ph]one", "si[ng]",
        "[ch]at", "[sh]op", "[th]this", "ba[th]", "[wh]ere", "[ph]oto", "si[ng]",
        "[ch]chip", "fi[sh]", "[th]em", "pa[th]", "[wh]ite", "gra[ph]", "so[ng]",
        "[ch]eck", "[sh]ell", "[th]then", "m[oo]th", "[wh]eat", "para[ph]", "ki[ng]",
        "[ch]est", "[sh]eep", "[th]those", "tee[th]", "[wh]ale", "ele[ph]ant", "ri[ng]",
        "[ch]chair", "[sh]oe", "[th]ese", "cl[th]", "[wh]eel", "alph[ph]a", "br[ng]"
    ],
    beginBlends: [
        "[bl]ack", "[br]own", "[cl]ap", "[cr]y", "[dr]um", "[fl]ag", "[fr]og",
        "[gl]ad", "[gr]een", "[pl]an", "[pr]ay", "[sc]an", "[sk]in", "[sl]ip",
        "[sm]all", "[sn]ap", "[sp]in", "[st]op", "[sw]im", "[tr]ee", "[tw]in",
        "[bl]ue", "[br]ead", "[cl]ip", "[cr]ab", "[dr]op", "[fl]at", "[fr]ee",
        "[gl]ass", "[gr]ape", "[pl]ay", "[pr]ess", "[sc]hool", "[sk]y", "[sl]ow",
        "[sm]ile", "[sn]ow", "[sp]eak", "[st]ar", "[sw]eet", "[tr]ain", "[tw]elve"
    ],
    endBlends: [
        "ha[nd]", "te[nt]", "fa[st]", "a[sk]", "cla[sp]", "le[ft]", "co[ld]",
        "wa[lk]", "he[lp]", "be[lt]", "ju[mp]", "ba[nk]", "ki[ng]", "a[ct]",
        "sa[nd]", "mi[nt]", "li[st]", "ta[sk]", "gra[sp]", "so[ft]", "ho[ld]",
        "ta[lk]", "ke[lp]", "sa[lt]", "la[mp]", "dri[nk]", "ri[ng]", "fa[ct]",
        "ba[nd]", "pri[nt]", "bu[st]", "ri[sk]", "cla[sp]", "gi[ft]", "fo[ld]",
        "he[nd]", "hu[nt]", "lo[st]", "de[sk]", "wi[sp]", "shi[ft]", "go[ld]"
    ],
    arWords: [
        "c[ar]", "f[ar]", "b[ar]", "st[ar]", "j[ar]", 
        "p[ark]", "d[ark]", "h[ard]", "c[ard]", "f[arm]", 
        "y[ard]", "sh[arp]", "m[art]", "p[ar]t", "b[arn]", 
        "m[ar]ch", "h[ar]p", "t[ar]t", "l[ar]k", "sc[ar]", 
        "ch[ar]t", "sm[ar]t", "sp[ar]k", "sh[ar]k", "g[ar]den", 
        "p[ar]ty", "c[ar]go", "l[ar]ge", "st[ar]t", "m[ar]k"
    ], 
    orWords:[
        "f[or]", "n[or]", "b[or]n", "c[or]n", "h[or]n", 
        "f[or]k", "p[or]k", "s[ort]", "sh[or]t", "p[or]t", 
        "f[or]m", "st[or]m", "t[or]ch", "m[ore]", "sh[ore]", 
        "sc[or]e", "sn[or]e", "st[or]e", "c[or]k", "f[or]ce", 
        "n[or]th", "h[or]se", "ch[or]d", "l[or]d", "f[or]t", 
        "t[or]n", "w[or]n", "p[or]ch", "sp[or]t", "sh[or]n"
    ],
consonantG: [
    "[g]et", "[g]ive", "[g]o", "[g]ood", "[g]ame", 
    "[g]reen", "[g]irl", "[g]oat", "[g]um", "[g]uess",
    "do[g]", "bo[g]", "ho[g]", "fo[g]", "jo[g]",
    "lo[g]", "ba[g]", "fla[g]", "dra[g]", "slu[g]",
    "bu[g]", "hu[g]", "mu[g]", "pu[g]", "ru[g]",
    "plu[g]", "[g]ross", "[g]reat", "[g]row", "[g]rass"
]
};

function populateWordSetSelector(selectorId) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    selector.innerHTML = '';
    phonemeSetInfo.forEach(set => {
        const option = document.createElement('option');
        option.value = set.key;
        option.textContent = set.name;
        selector.appendChild(option);
    });
}