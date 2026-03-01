// ============================================================
// OshiQuest — デザイントークン
// ============================================================
// "ポケ森＋Notion" — 可愛さと整理された実用性の両立
// ターゲット: 20〜30代女性
// ============================================================

export const COLORS = {
    // Primary — ラベンダーピンク（メインアクセント）
    primary: {
        50: '#FFF0F6',
        100: '#FFE0ED',
        200: '#FFC1DB',
        300: '#FF9BBF',
        400: '#FF6FA3',
        500: '#FF4D8D', // メインカラー
        600: '#E63B7A',
        700: '#CC2A66',
        800: '#A31D50',
        900: '#7A1340',
    },

    // Secondary — パステルパープル
    secondary: {
        50: '#F5F0FF',
        100: '#EBE0FF',
        200: '#D6C2FF',
        300: '#BEA3FF',
        400: '#A685FF',
        500: '#8B6CE7', // サブカラー
        600: '#7557CC',
        700: '#5F42B0',
        800: '#4A2E95',
        900: '#351A7A',
    },

    // Accent — コーラルオレンジ（CTAボタン等）
    accent: {
        50: '#FFF4F0',
        100: '#FFE8E0',
        200: '#FFD1C2',
        300: '#FFB5A3',
        400: '#FF9A85',
        500: '#FF7F6B', // アクセント
        600: '#E66B57',
        700: '#CC5843',
        800: '#A64530',
        900: '#80331D',
    },

    // Neutral — 温かみのあるグレー
    neutral: {
        0: '#FFFFFF',
        50: '#FAF8F7',
        100: '#F5F1EF',
        200: '#EBE5E2',
        300: '#DDD5D0',
        400: '#C4BAB4',
        500: '#A69E98',
        600: '#887E78',
        700: '#6A6258',
        800: '#4C4438',
        900: '#2E2618',
        1000: '#1A1410',
    },

    // Semantic
    success: '#6DD5A0',
    warning: '#FFD166',
    error: '#FF6B6B',
    info: '#74B9FF',

    // Rarity Colors
    rarity: {
        common: '#A69E98',
        uncommon: '#6DD5A0',
        rare: '#74B9FF',
        epic: '#BEA3FF',
    },

    // Gradient Presets
    gradients: {
        primary: ['#FF6FA3', '#8B6CE7'] as const,
        sunset: ['#FF7F6B', '#FF4D8D'] as const,
        aurora: ['#74B9FF', '#BEA3FF', '#FF9BBF'] as const,
        gold: ['#FFD166', '#FFA94D'] as const,
    },
} as const;

export const TYPOGRAPHY = {
    fontFamily: {
        heading: 'NotoSansJP-Bold',
        body: 'NotoSansJP-Regular',
        accent: 'NotoSansJP-Medium',
        mono: 'RobotoMono-Regular',
    },
    fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 20,
        '2xl': 24,
        '3xl': 32,
        '4xl': 40,
        hero: 48,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
} as const;

export const SPACING = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
} as const;

export const BORDER_RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
} as const;

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
    glow: {
        shadowColor: '#FF4D8D',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
} as const;

export const ANIMATION = {
    duration: {
        instant: 100,
        fast: 200,
        normal: 300,
        slow: 500,
        xSlow: 800,
    },
    easing: {
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    },
} as const;
