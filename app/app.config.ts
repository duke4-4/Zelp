export default defineAppConfig({
  ui: {
    colors: {
      primary: 'flame',
      secondary: 'green',
      success: 'green',
      warning: 'gold',
      error: 'closed',
      neutral: 'ink',
    },
    // Shape system: buttons/badges (chips) are fully pill, inputs get the
    // brief's 12px radius. twMerge resolves the conflicting `rounded-*`
    // utility against Nuxt UI's own defaults, so these overrides "win"
    // without needing to restate the rest of each slot's classes.
    button: {
      slots: {
        base: 'rounded-full',
      },
    },
    badge: {
      slots: {
        base: 'rounded-full',
      },
    },
    input: {
      slots: {
        base: 'rounded-[12px]',
      },
    },
    select: {
      slots: {
        base: 'rounded-[12px]',
      },
    },
    selectMenu: {
      slots: {
        base: 'rounded-[12px]',
      },
    },
    modal: {
      slots: {
        content: 'rounded-[18px]',
      },
    },
  },
})
