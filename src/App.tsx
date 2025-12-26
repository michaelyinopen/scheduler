import { WithDndContext } from './WithDndContext'
import { WithConnection } from './WithConnection'
import { WithErrorBoundary } from './WithErrorBoundary'
import { ErrorBoundary } from './components/ErrorBoundary'
import { TitleAndDescription } from './JobSet/TitleAndDescription'
import { Timeline, GroupAxis, ScheduleBody, TimeAxis } from './Timeline'
import { JobSet, EditModes } from './JobSet'
import './theme.css'
import './App.css'

function App() {
  return (
    <ErrorBoundary fallback={'Something went wrong, please refresh page'}>
      <div className='app'>
        <WithConnection>
          <WithErrorBoundary>
            <WithDndContext>
              <TitleAndDescription />
              <EditModes />
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
