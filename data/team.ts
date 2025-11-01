export interface ProjectTeamMember {
  id: string
  name: string
  role: string
  avatarUrl: string
}

export interface ProjectTeam {
  projectId: string
  members: ProjectTeamMember[]
}

export const PROJECT_TEAMS: ProjectTeam[] = [
  {
    projectId: 'design-refresh',
    members: [
      {
        id: 'ivan-ivanov',
        name: 'Иван Иванов',
        role: 'Разработчик',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuB274va3NlNhycW5R6ChTqLAkPcOO6eyvJ5Sfj11LDrbBYw-oWruaCB-Wf55pTRym3gtQ4WWybIjO7jdKAuRKghnwYgA-jA1W0hztnl_9-VZlQ2tlH25ovMklQ1MZMmAjPw8pSIvXGCfkZR9uUPmsfPuG-pEDmcYAek0HmuDue6CEQUieM3xQXdvgr2_pIMA8U5tJyeG8NuQEpqnra2NE5Be6h1LkyB7W31ZFjZTSikk_vKH7eYaF0nGbfHIIcNdkgehBCGM0WEug0',
      },
      {
        id: 'anna-kuznetsova',
        name: 'Анна Кузнецова',
        role: 'Дизайнер',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuA4S-FgSi_AUIYxKuDKiAvF79NIKGcIiu6PZD78wEIOoyoKAaP_dpSYUfYi-57VMKT0nHMSB4GE_M8MIYkyXWxzTSAdDlFPb5PL3G05mgCW2E4uzWDIndUNMVL0GFHQK7asOh840hRt40ThSRxa854J9Mg3803O-oAPxUcHOgeU6_6SehB1vx3JzpZE_xjItzv8GCl4rohaw6x_HWIq6D_Wr_Z3V-ytfwTlx2xQRf1v8H7U1XSPvGNrYdCIznkYAOmsGlBtJkY0Z8c',
      },
      {
        id: 'petr-smirnov',
        name: 'Петр Смирнов',
        role: 'Менеджер',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAhyzXIIL_jx-5Ap5WPaM5ejNNh5lIO0FSCCPBBvKcUQ6FCfIi_tCiMJuzzLBJ0OvPUqt2nUjQYMMsbkpavz_YVz6c0OKnVIly-gDOgnw3k0Qexp6QYBqeJEwmGnl8p83TV6znN2NRBwR19hNS1wZ-wrLneOK8D3Q9JwUtxX5y2LJM32IE8KhKFqCExCWbxQpO0W5HxhRJgkq0bx645pxwaKpN6Zs9HA1WuUGkNT15AamLqrVkOgel-ZOLf5R5DCN7AfFHLzh7V--k',
      },
      {
        id: 'elena-volkova',
        name: 'Елена Волкова',
        role: 'QA инженер',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuApzNRRbvhuT1VpmOz7z_7mchiHMHCRG7lj5AicX6tWAXRmYWJtO3j91zQsuM43999SFYDra9Z70aqRiwH5pe8vQBmcqUioKEdvMZ6Tz8mjjWHonQtQ4zMmPBRVMCCqFF7QQWwiZS38jETmJxUGOHWbhW8C8OHWVYgkybG2ebXgfc0C59co2NsuQJI3gMLP1A3Ibnwe3dM8khDm8LOf4qjByNy_c8P_7sZROPom7rvcoACQaW7rDqxe9OYxMOAb6n1DnHxXNUczv08',
      },
    ],
  },
  {
    projectId: 'marketing-q4',
    members: [
      {
        id: 'timur-melnikov',
        name: 'Тимур Мельников',
        role: 'Маркетолог',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCugrgxa0nHwhMTwZtmcUcFfXXpAnESNcfGsLRNV0kgXjYPRbhIOnhCIUIw5pxRgu8bBn32ECAXO6rqX4NvQ4OP7ikzDfSZvby0oFs_0VdssibbgmrP-WcgQ3iSTHXXIhtca9B9TEy9cGcyvEoq3eq9ZGo_NnWcfq4yV1B-',
      },
      {
        id: 'anna-lebedeva',
        name: 'Анна Лебедева',
        role: 'Копирайтер',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAgbV_GsxLo6XbS8Pm21S-hw8gv1z-EJiijOxIEzD2HiUJv0n7-Ux7L-kNWYpPciAvAX62VmH5A15ruLBHAB4agK50Jk-m7LAqgKAFIqtX8J8Xytl1c4iQI4Ql1mMuTDPScdwwGJfEKtKe8zU6hzMOgPcoLKXCzG6uK8y5B',
      },
      {
        id: 'dmitry-orlov',
        name: 'Дмитрий Орлов',
        role: 'Менеджер по партнёрствам',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDDV5vEV9M3Xh72gMqbMcGDN42TAyWQj-4u9Qp1XjR2gLOxOBE1Q0ngsM0aLtLqkSn1Zzsvfi3DW2EFZcWt-eZV6zQkmqOmy6PcgIT-Z4F4Xe9Nx4FvAYf4GztG9t0z0ttMzcV7zWx9wHhSkrJwdh6cL9YLoxWbMd0dfSN-',
      },
      {
        id: 'marina-yakovleva',
        name: 'Марина Яковлева',
        role: 'Дизайнер',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBzywHTePrl1TgwxOWdwgWkn5zsFWEKwq1W1Lg9Sxjpj-LIxMXYc_9gC5LmTGqZgUij8h05K0W6rkN_t5GgujDSi05xwZRIok5XHk4l_kYqB_Dvx0iw9fZ1I30vMu8JSa94QeIoq--QfqZeY3W-ZB3Qzu8nOkqAPdD1Rar7',
      },
    ],
  },
  {
    projectId: 'api-upgrade',
    members: [
      {
        id: 'artem-sidorov',
        name: 'Артём Сидоров',
        role: 'Бэкенд-разработчик',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAQIv16hXzQib-2I2s_SjFu2XzhdUHJu7olJmQxtZdfOq0hDZx6pB7f45c7qE-4YKr8pAKJWVtPe_KHk0iJpw9JAK8tsBBLJRVEV2wPbgvTWuNcuaxVNaUKuhID_4blwKQVe6t81xED27qZHV6uhMDOYoFj2-HQxn0xgSLMj5AWE4k',
      },
      {
        id: 'svetlana-novikova',
        name: 'Светлана Новикова',
        role: 'DevOps инженер',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAmjLxi1zJVD-Q58kAbRISeLhRjuRUp7OW6KaX9qVV5X0Hx-4ElKdwW9LsWH5g1rr-oXgQupM0MBErFpqCdsNjUfaSGN8nQTslRW_Fz6DUErLyiXo0j66P0YK50zQZzSmECZt4ZQ3jg1fiS46PKJcK9bMzGz3ex5QFNVv_igWtZnS7W',
      },
      {
        id: 'roman-vasiliev',
        name: 'Роман Васильев',
        role: 'Тимлид',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBK9pmg1tnRfyU_QVZNBzbyXyJgQy8p8VnHGwfjrP5wqJqYl2P0wREfI6bkz1rvK7E69Co1yn52vtQpo5pVXvRFDhXgRpZMTfI0gY14h9CfVGQS8JjYdC7AS7LLwnB0Xnb5pTgWHz5owzySQHZfnDr6aRmEUYEswzFk5xuU5SFMgCeZ',
      },
      {
        id: 'irina-mironova',
        name: 'Ирина Миронова',
        role: 'QA инженер',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuA9WwY2n7Kk5CYrGmtQcm6ADon31dlk1hqexX2cYT1ceEwXSGgmzU8mVClcCo8kLaC5EsJ2o0-lx9w6n_BsLbmNHa1S0-FJykVbiO5YZkP6bc14-sI2JjwvqA5agD8xPZ6h2K6NJbF5b-k7YYRU9Sz-SQ5YqXA2D28ep8V1XZ9Rz7E',
      },
    ],
  },
]
