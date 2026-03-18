import { motion } from 'framer-motion';
import Image from 'next/image';

export const Greeting = () => {
  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <div className="flex flex-row items-center gap-3 mb-2">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ delay: 0.4 }}
        >
          <Image
            src="/favicon.ico"
            alt="3T Chat Logo"
            width={64}
            height={64}
            className="size-16 flex-1 rounded-full"
            priority
          />
        </motion.div>
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-semibold"
          >
            Welcome to 3T Chat!
          </motion.div>
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.6 }}
              className="text-2xl text-zinc-500"
            >
              Your intelligent AI assistant is ready to help.
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
