import React from 'react';
import Header from './components/Header';
import CommonModal from './components/CommonModal';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { TrainingProvider } from './context/TrainingContext';

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <TrainingProvider>
          <Header />
          <main className="mx-auto my-8 flex w-full max-w-7xl flex-col gap-8 px-5 md:my-12 md:gap-10 md:px-8">
            <AppRoutes />
          </main>
          <footer className="my-16 text-center text-xs text-[#8D938B]">
            글적글적 · 나의 생각을 쓰고 다듬다
          </footer>
          <CommonModal />
        </TrainingProvider>
      </ModalProvider>
    </AuthProvider>
  );
}
