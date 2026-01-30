import { useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { motion, AnimatePresence } from 'framer-motion';

export function MainLayout() {
    const location = useLocation();

    // Use location.pathname as the key for AnimatePresence
    // This triggers the exit animation when the path changes
    return (
        <div className="flex flex-col min-h-screen bg-background pb-16 md:pb-0">
            {/* 
                We use AnimatePresence with wait=false or true depending on preference.
                mode="wait": Old page exits fully before new page enters.
                mode="popLayout": Old page exits while new page enters (smoother, but requires absolute positioning).
            */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 w-full"
                >
                    <Outlet />
                </motion.div>
            </AnimatePresence>

            <BottomNavigation />
        </div>
    );
}
