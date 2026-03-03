import { useNavigate } from 'react-router-dom'
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import NotificationItem from '@/components/notifications/NotificationItem'
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/useNotifications'
import { Fragment } from 'react'

export default function NotificationCenter() {
  const navigate = useNavigate()

  const { data: notifications, unreadCount } = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const handleMarkRead = (id: string) => {
    markRead.mutate(id)
  }

  const handleMarkAllRead = () => {
    markAllRead.mutate()
  }

  return (
    <Popover className="relative">
      {({ close }) => (
        <>
          <PopoverButton
            className="relative inline-flex items-center justify-center rounded-md p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-dark-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[0.65rem] font-medium min-w-[18px] h-[18px] px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel className="absolute right-0 z-50 mt-2 w-[380px] max-h-[480px] flex flex-col rounded-xl border border-surface-200 bg-white shadow-lg dark:bg-dark-surface dark:border-dark-border overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-semibold text-text-primary">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<CheckCheck className="h-4 w-4" />}
                    onClick={handleMarkAllRead}
                    loading={markAllRead.isPending}
                  >
                    Mark all read
                  </Button>
                )}
              </div>

              <hr className="border-surface-200 dark:border-dark-border" />

              {/* Notification list */}
              <div className="flex-1 overflow-auto">
                {(!notifications || notifications.length === 0) ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-text-disabled mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">
                      No notifications
                    </p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={handleMarkRead}
                      />
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-surface-200 dark:border-dark-border" />

              {/* Footer */}
              <div className="p-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    close()
                    navigate('/notifications')
                  }}
                >
                  View all
                </Button>
              </div>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  )
}
