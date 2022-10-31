import React, { MutableRefObject, ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { Slide, SlideProps, DialogProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const TContainer = styled('div')(({ theme }) => ({
  '& .appBar': {
    position: 'fixed',
    right: 0,
    width: '5rem',
  },
  '& .title': {
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
    <>
      {/*
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Open full-screen dialog
      </Button>
      */}
      <Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
        <TContainer className="tContainer">
          <AppBar className={'appBar'}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleClose}
                aria-label="close"
                size="large"
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" className={'title'}></Typography>
            </Toolbar>
          </AppBar>
          <div className="contentContainer">{children}</div>
        </TContainer>
      </Dialog>
    </>
  );
});

export default AnyListDialogRef;
