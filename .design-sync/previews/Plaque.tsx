import { Plaque, ZoneLabel } from '@trakkit/ui'

export const PageTitle = () => <Plaque>Board</Plaque>

export const Small = () => <Plaque size="sm">Deadlines</Plaque>

export const WithZones = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
    <Plaque>This week</Plaque>
    <div style={{ display: 'flex', gap: 8 }}>
      <ZoneLabel>Today</ZoneLabel>
      <ZoneLabel>This week</ZoneLabel>
      <ZoneLabel>Blocked</ZoneLabel>
    </div>
  </div>
)
