import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: 'relative',
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
}));

const Transition: any = React.forwardRef(function Transition(props: any, ref: any) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AnyListDialogRef = React.forwardRef(function AnyListDialog(props, ref: any) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const [children, setChildren] = React.useState(null);
  const handleClickOpen = (children: any) => {
    setChildren(children);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setChildren(null);
  };

  ref.current = { handleClickOpen };

  return (
    <div>
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Open full-screen dialog
      </Button>
      <Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
        <AppBar className={classes.appBar}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}></Typography>
          </Toolbar>
        </AppBar>
        {children}
      </Dialog>
    </div>
  );
});

export default AnyListDialogRef;
