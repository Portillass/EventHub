import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EventIcon from '@mui/icons-material/Event';
import FeedbackIcon from '@mui/icons-material/Feedback';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'center',
}));

const Sidebar = ({ menuItems, activeSection, setActiveSection }) => {
  const getIcon = (value) => {
    switch (value) {
      case 'events':
        return <EventIcon />;
      case 'feedback':
        return <FeedbackIcon />;
      case 'logout':
        return <LogoutIcon />;
      default:
        return null;
    }
  };

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    } else {
      setActiveSection(item.value);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <DrawerHeader>
        <Typography variant="h6" component="div">
          EventHub
        </Typography>
      </DrawerHeader>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.value} disablePadding>
            <ListItemButton
              selected={activeSection === item.value}
              onClick={() => handleItemClick(item)}
            >
              <ListItemIcon>
                {getIcon(item.value)}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 