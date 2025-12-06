import { WithDndContext } from './WithDndContext'
import { WithConnection } from './WithConnection'
import { WithErrorBoundary } from './WithErrorBoundary'
import { Timeline, GroupAxis, ScheduleBody, TimeAxis } from './Timeline'
import { ErrorBoundary } from './components/ErrorBoundary'
import { JobSet } from './JobSet'
import './theme.css'
import './App.css'
import { TitleAndDescription } from './JobSet/TitleAndDescription'

function App() {
  return (
    <ErrorBoundary fallback={'Something went wrong, please refresh page'}>
      <div className='app'>
        <WithConnection>
          <WithErrorBoundary>
            <WithDndContext>
              <TitleAndDescription />
              <JobSet />
              <Timeline>
                <GroupAxis />
                <ScheduleBody />
                <TimeAxis />
              </Timeline>
            </WithDndContext>
          </WithErrorBoundary>
        </WithConnection>
      </div>
    </ErrorBoundary>
  )
}

export default App
