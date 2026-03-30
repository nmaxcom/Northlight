import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  primaryColor: 'steel',
  colors: {
    steel: [
      '#f3f6f8',
      '#dce3e8',
      '#c5d0d8',
      '#a9bac7',
      '#8ea4b8',
      '#738ea8',
      '#5d7890',
      '#496178',
      '#364a5d',
      '#22303f'
    ]
  },
  defaultRadius: 'md',
  radius: {
    xl: '20px'
  },
  shadows: {
    md: '0 18px 60px rgba(0, 0, 0, 0.28)',
    xl: '0 24px 90px rgba(0, 0, 0, 0.38)'
  },
  headings: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
  }
});
