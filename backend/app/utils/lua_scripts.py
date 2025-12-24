def get_decr_stock_script() -> str:
    return """
    local current_stock = tonumber(redis.call('get', KEYS[1]))
    if current_stock == nil then
        return -1
    end
    if current_stock >= tonumber(ARGV[1]) then
        redis.call('decrby', KEYS[1], ARGV[1])
        return tonumber(redis.call('get', KEYS[1]))
    else
        return -2
    end
    """