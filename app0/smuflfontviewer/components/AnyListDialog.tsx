import React, { MutableRefObject, ReactNode } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import { Slide, SlideProps, DialogProps } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: 'fixed',
    right: 0,
    width: '5rem',
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
}));

const Transition: DialogProps['TransitionComponent'] = React.forwardRef(function Transition(
  props,
  ref,
) {
  return <Slide direction="up" ref={ref} {...(props as SlideProps)} />;
});

export type IHandlers = { handleClickOpen: (children: ReactNode) => void | null };
// type AnyListDialogProp = null; // {someprop: proptype}

const AnyListDialogRef = React.forwardRef<IHandlers>(function AnyListDialog(props, ref) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const [children, setChildren] = React.useState<ReactNode | null>(null);
  const handleClickOpen = (children: ReactNode) => {
    setChildren(children);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setChildren(null);
  };

  if (ref) {
    const funcs = { handleClickOpen };
    (ref as MutableRefObject<IHandlers>).current = funcs;
    /* FIXME: more detailed check?
    if (typeof ref === 'function') {
      ref(funcs);
    } else if (ref) {
      (ref as React.MutableRefObject<IHandlers>).current = funcs;
    }
    */
  }

  return (
    <div>
      {/*
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Open full-screen dialog
      </Button>
      */}
      <Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
        <AppBar className={classes.appBar}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}></Typography>
          </Toolbar>
        </AppBar>
        <div className="contentContainer">{children}</div>
      </Dialog>
    </div>
  );
});

export default AnyListDialogRef;
