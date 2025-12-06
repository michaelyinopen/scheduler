import classes from './Procedure.module.css'

export type ProcedureSequenceLabelProps = {
  sequence: number
}

export const ProcedureSequenceLabel = ({ sequence }: ProcedureSequenceLabelProps) => {
  return (
    <div className={classes.procedureSequenceLabel}>
      {sequence}
    </div>
  )
}
