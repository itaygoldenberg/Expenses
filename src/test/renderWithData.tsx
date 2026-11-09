import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ExpensesProvider } from '../features/expenses/ExpensesProvider'

/** Renders a page inside the router and the shared records provider (the API client is mocked by each test). */
export function renderWithData(ui: ReactNode, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ExpensesProvider>{ui}</ExpensesProvider>
    </MemoryRouter>,
  )
}
