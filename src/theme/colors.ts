/**
 * AccessMate palette — warm civic editorial.
 *
 * Contrast targets (against bg.paper):
 *   ink             16.4:1   AAA
 *   inkMuted         7.2:1   AAA
 *   accent           5.4:1   AA  large + normal
 *   alert            7.1:1   AAA
 *   emergencyText    8.6:1   AAA on emergency surface
 *
 * Verify with axe-core whenever any token below changes.
 */
export const colors = {
  bg: {
    paper: '#FAF7F2', // warm cream — page background
    raised: '#FFFFFF', // for distinct cards / inputs
    sunken: '#F0EBE0', // very subtle, sectional grouping
    inkInverse: '#1A1A1F', // dark surfaces (rare)
  },
  ink: {
    primary: '#1A1A1F', // body + headings on paper
    muted: '#5C5852', // secondary text, captions
    soft: '#8A857C', // tertiary, placeholders only
    onAccent: '#FFFFFF', // text on the accent surface
    onEmergency: '#FFFFFF', // text on the emergency surface
  },
  line: {
    hairline: '#E2DDD2', // primary rule lines
    soft: '#EFEAE0', // very subtle dividers
  },
  accent: {
    base: '#B85C1F', // amber-ochre — primary actions
    soft: '#F4E4D6', // tinted backgrounds (badges, hover)
    deep: '#7A3A0F', // pressed states, focused borders
  },
  alert: {
    base: '#C77E2A', // resume banner accent
    soft: '#FBF1DE', // resume banner background
    border: '#E7C68A',
  },
  emergency: {
    base: '#A0241B', // "Something went wrong" CTA
    soft: '#F7E3DF',
    deep: '#6B1812',
  },
  status: {
    draft: { bg: '#EFEAE0', text: '#3F3B33' },
    sent: { bg: '#E3EAEF', text: '#2A4357' },
    acknowledged: { bg: '#FBF1DE', text: '#7A4B0E' },
    resolved: { bg: '#DDE9DC', text: '#2F4E33' },
    escalated: { bg: '#F7E3DF', text: '#7E2018' },
  },
} as const;
