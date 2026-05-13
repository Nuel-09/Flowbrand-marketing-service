import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../../src/users/entities/user.entity';
import { UsersService } from '../../../../src/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  const mockRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('findAll delegates to repository', async () => {
    await expect(service.findAll()).resolves.toEqual([]);
    expect(mockRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });
});
