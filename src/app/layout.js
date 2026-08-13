import React from 'react'

export default function RootLayout({ children }) {
  return React.createElement('html', { lang: 'pt-BR' }, React.createElement('body', null, children))
}
