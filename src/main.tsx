import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { defaultJobSetId } from './constants.tsx'
import App from './App.tsx'
import './index.css'
import { Layout } from './components/Layout.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path='/'>
            <Route index element={<Navigate to={defaultJobSetId.toString()} replace={true} />} />
            <Route
              path=":jobSetId/solution?"
              element={<App />}
            />
            <Route path='*' element={<Navigate to='/' replace={true} />} />
          </Route>
        </Routes>
      </Layout>
    </BrowserRouter>
  </StrictMode>,
)
